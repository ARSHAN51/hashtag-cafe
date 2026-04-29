import { missingFirebaseKeys } from "@/lib/env";
import { cn } from "@/lib/utils";

export function FirebaseSetupAlert({ className }: { className?: string }) {
  if (missingFirebaseKeys.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-yellow-400/20 bg-yellow-400/8 px-5 py-4 text-sm leading-7 text-yellow-100 shadow-xl shadow-yellow-500/5 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-400 text-black">
          !
        </span>
        <div>
          <p className="font-semibold">Firebase configuration is incomplete.</p>
          <p className="text-xs uppercase tracking-[0.24em] text-yellow-200/70">
            Setup needed before auth and ordering go live
          </p>
        </div>
      </div>
      <p className="mt-1">
        Add the missing <code>NEXT_PUBLIC_FIREBASE_*</code> values to{" "}
        <code>.env.local</code> before using auth or Firestore.
      </p>
      <p className="mt-2 font-medium">
        Missing keys: {missingFirebaseKeys.join(", ")}
      </p>
    </div>
  );
}
