import { motion } from "framer-motion";

type CategoryTab = { count: number; label: string };

type CategoryTabsProps = {
  categories: CategoryTab[];
  activeCategory: string;
  onSelect: (label: string) => void;
};

export function CategoryTabs({ activeCategory, categories, onSelect }: CategoryTabsProps) {
  return (
    <div className="hide-scrollbar flex gap-2.5 overflow-x-auto">
      {categories.map((cat) => {
        const active = activeCategory === cat.label;
        return (
          <motion.button
            key={cat.label}
            type="button"
            onClick={() => onSelect(cat.label)}
            aria-pressed={active}
            whileTap={{ scale: 0.93 }}
            className="shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-150"
            style={
              active
                ? { background: "#ffc107", color: "#111" }
                : {
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "#ccc",
                  }
            }
          >
            {cat.label}
          </motion.button>
        );
      })}
    </div>
  );
}
