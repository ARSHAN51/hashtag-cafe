"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { ADMIN_ALERTS_STORAGE_KEY } from "@/lib/constants";
import { useAdminData } from "@/components/providers/admin-data-provider";

type AdminAlertsResult = {
  alertsEnabled: boolean;
  notificationSupported: boolean;
  setAlertsEnabled: (value: boolean) => Promise<void>;
};

type ToneStep = {
  delayMs: number;
  durationMs: number;
  frequency: number;
  gain: number;
};

function playToneSequence(
  context: AudioContext,
  steps: ToneStep[],
  oscillatorType: OscillatorType,
) {
  steps.forEach((step) => {
    const startAt = context.currentTime + step.delayMs / 1000;
    const endAt = startAt + step.durationMs / 1000;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = oscillatorType;
    oscillator.frequency.value = step.frequency;
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(step.gain, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt);
  });
}

export function useAdminLiveAlerts(): AdminAlertsResult {
  const { orders, requests } = useAdminData();
  const [alertsEnabled, setAlertsEnabledState] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(ADMIN_ALERTS_STORAGE_KEY) === "true";
  });
  const orderIdsRef = useRef<Set<string> | null>(null);
  const waiterKeysRef = useRef<Set<string> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const notificationSupported =
    typeof window !== "undefined" && "Notification" in window;

  async function ensureAudioContext() {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }

  const emitAlert = useEffectEvent(async (
    type: "order" | "waiter",
    title: string,
    description: string,
  ) => {
    toast(title, { description });

    if (notificationSupported && Notification.permission === "granted") {
      new Notification(title, { body: description });
    }

    const context = await ensureAudioContext();

    if (!context) {
      return;
    }

    if (type === "order") {
      playToneSequence(
        context,
        [
          { delayMs: 0, durationMs: 130, frequency: 660, gain: 0.03 },
          { delayMs: 150, durationMs: 130, frequency: 880, gain: 0.03 },
          { delayMs: 300, durationMs: 180, frequency: 1046, gain: 0.035 },
        ],
        "triangle",
      );
      return;
    }

    playToneSequence(
      context,
      [
        { delayMs: 0, durationMs: 220, frequency: 392, gain: 0.03 },
        { delayMs: 260, durationMs: 220, frequency: 392, gain: 0.03 },
        { delayMs: 540, durationMs: 260, frequency: 294, gain: 0.035 },
      ],
      "square",
    );
  });

  useEffect(() => {
    const orderIds = new Set(orders.map((order) => order.id));

    if (!alertsEnabled) {
      orderIdsRef.current = orderIds;
      return;
    }

    if (!orderIdsRef.current) {
      orderIdsRef.current = orderIds;
      return;
    }

    const newOrders = orders.filter((order) => !orderIdsRef.current?.has(order.id));

    newOrders.forEach((order) => {
      void emitAlert(
        "order",
        `New order from Table ${order.tableNumber}`,
        `${order.items.length} item${order.items.length === 1 ? "" : "s"} added to the kitchen queue.`,
      );
    });

    orderIdsRef.current = orderIds;
  }, [alertsEnabled, orders]);

  useEffect(() => {
    const pendingRequests = requests.filter((request) => request.status === "pending");
    // Track by id+timestamp so repeated calls from the same table also trigger an alert
    const waiterKeys = new Set(
      pendingRequests.map(
        (request) => `${request.id}-${request.createdAt?.getTime() ?? 0}`,
      ),
    );

    if (!alertsEnabled) {
      waiterKeysRef.current = waiterKeys;
      return;
    }

    if (!waiterKeysRef.current) {
      waiterKeysRef.current = waiterKeys;
      return;
    }

    const newRequests = pendingRequests.filter(
      (request) =>
        !waiterKeysRef.current?.has(
          `${request.id}-${request.createdAt?.getTime() ?? 0}`,
        ),
    );

    newRequests.forEach((request) => {
      void emitAlert(
        "waiter",
        `Waiter call from Table ${request.tableNumber}`,
        "A guest is asking for help right now.",
      );
    });

    waiterKeysRef.current = waiterKeys;
  }, [alertsEnabled, requests]);

  const setAlertsEnabled = async (value: boolean) => {
    setAlertsEnabledState(value);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_ALERTS_STORAGE_KEY, String(value));
    }

    if (!value) {
      return;
    }

    await ensureAudioContext();

    if (notificationSupported && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  return {
    alertsEnabled,
    notificationSupported,
    setAlertsEnabled,
  };
}
