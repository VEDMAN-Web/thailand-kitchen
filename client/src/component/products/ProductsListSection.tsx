"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";
import {
  productItems,
  productFilterTabs,
  filterOptions,
  sortOptions,
  PRODUCTS_PER_PAGE,
  type ProductFilterTab,
  type ProductLayout,
} from "./productData";
import { useTranslation } from "../../i18n/LanguageProvider";
import type { TranslationKey } from "../../i18n/translations";

const filterLabelKeys: Partial<Record<string, TranslationKey>> = {
  "Select Style": "products.filter.selectStyle",
  Color: "products.filter.color",
  Finish: "products.filter.finish",
  Material: "products.filter.material",
};

const sortLabelKeys: Record<string, TranslationKey> = {
  "Sort By": "products.sort.label",
  Newest: "products.sort.newest",
  "Name A–Z": "products.sort.nameAsc",
  "Name Z–A": "products.sort.nameDesc",
};

function tabFromQuery(value: string | null): ProductFilterTab | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[_\s]+/g, "-");
  if (normalized === "best-seller" || normalized === "bestseller") {
    return "Best Seller";
  }
  const match = productFilterTabs.find(
    (tab) => tab.toLowerCase().replace(/\s+/g, "-") === normalized
  );
  return match ?? null;
}

export default function ProductsListSection() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [layout, setLayout] = useState<ProductFilterTab>("Modern");
  const [style, setStyle] = useState(filterOptions.style[0]);
  const [color, setColor] = useState(filterOptions.color[0]);
  const [finish, setFinish] = useState(filterOptions.finish[0]);
  const [material, setMaterial] = useState(filterOptions.material[0]);
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fromQuery =
      tabFromQuery(searchParams.get("tab")) ||
      tabFromQuery(searchParams.get("filter"));
    if (fromQuery) {
      setLayout(fromQuery);
      setPage(1);
    }
    if (fromQuery === "Best Seller" || searchParams.get("tab") === "best-seller") {
      requestAnimationFrame(() => {
        document
          .getElementById("best-seller")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = [...productItems];

    if (layout === "Best Seller") {
      // Best sellers that still pass dropdown filters (not filtered out)
      list = list.filter((item) => item.bestSeller);
    } else if (layout !== "Modern") {
      list = list.filter((item) => item.layoutType === (layout as ProductLayout));
    }

    if (style !== "Select Style") {
      list = list.filter((item) => item.style === style);
    }
    if (color !== "Color") {
      list = list.filter((item) => item.color === color);
    }
    if (finish !== "Finish") {
      list = list.filter((item) => item.finish === finish);
    }
    if (material !== "Material") {
      list = list.filter((item) => item.material === material);
    }

    if (sortBy === "Name A–Z") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "Name Z–A") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "Newest") {
      list.sort((a, b) => b.id - a.id);
    }

    return list;
  }, [layout, style, color, finish, material, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const selectClass =
    "w-full h-12 rounded-full bg-[#EDE8E1] px-5 text-sm text-[#1A1A1A] outline-none appearance-none bg-[url('/arrow-down.svg')] bg-no-repeat bg-[right_1.1rem_center] bg-[length:12px]";

  const filterLabel = (opt: string) => {
    const key = filterLabelKeys[opt];
    return key ? t(key) : opt;
  };

  const sortLabel = (opt: string) => t(sortLabelKeys[opt] ?? "products.sort.label");

  return (
    <section id="best-seller" className="pb-16 lg:pb-24 pt-10 lg:pt-12 scroll-mt-28">
      {/* Layout tabs + Best Seller */}
      <div className="flex flex-wrap gap-3">
        {productFilterTabs.map((item) => {
          const isActive = layout === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                setLayout(item);
                setPage(1);
                if (item === "Best Seller") {
                  const url = new URL(window.location.href);
                  url.searchParams.set("tab", "best-seller");
                  window.history.replaceState({}, "", url.toString());
                } else {
                  const url = new URL(window.location.href);
                  url.searchParams.delete("tab");
                  window.history.replaceState({}, "", url.toString());
                }
              }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
                isActive
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-[#EDE8E1] text-[#1A1A1A] hover:bg-[#E5DFD6]"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* Dropdown filters */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select
          value={style}
          onChange={(e) => {
            setStyle(e.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          {filterOptions.style.map((opt) => (
            <option key={opt} value={opt}>
              {filterLabel(opt)}
            </option>
          ))}
        </select>

        <select
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          {filterOptions.color.map((opt) => (
            <option key={opt} value={opt}>
              {filterLabel(opt)}
            </option>
          ))}
        </select>

        <select
          value={finish}
          onChange={(e) => {
            setFinish(e.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          {filterOptions.finish.map((opt) => (
            <option key={opt} value={opt}>
              {filterLabel(opt)}
            </option>
          ))}
        </select>

        <select
          value={material}
          onChange={(e) => {
            setMaterial(e.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          {filterOptions.material.map((opt) => (
            <option key={opt} value={opt}>
              {filterLabel(opt)}
            </option>
          ))}
        </select>
      </div>

      {/* Count + sort */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[#1A1A1A] font-medium">
          {t("products.count", { count: filtered.length })}
        </p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-11 rounded-full bg-[#EDE8E1] px-5 pr-10 text-sm text-[#1A1A1A] outline-none appearance-none bg-[url('/arrow-down.svg')] bg-no-repeat bg-[right_1rem_center] bg-[length:12px]"
        >
          {sortOptions.map((opt) => (
            <option key={opt} value={opt}>
              {sortLabel(opt)}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {pageItems.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {pageItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-[#6B6B6B]">{t("products.empty")}</p>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="mt-12 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-10 h-10 rounded-full text-[#1A1A1A] disabled:opacity-30 hover:bg-[#EDE8E1] transition"
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setPage(num)}
              className={`w-10 h-10 rounded-full text-sm font-semibold transition ${
                currentPage === num
                  ? "bg-[#E0905A] text-white"
                  : "text-[#1A1A1A] hover:bg-[#EDE8E1]"
              }`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-10 h-10 rounded-full text-[#1A1A1A] disabled:opacity-30 hover:bg-[#EDE8E1] transition"
          >
            →
          </button>
        </div>
      ) : null}
    </section>
  );
}
