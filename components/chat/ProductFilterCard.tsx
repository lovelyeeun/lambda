"use client";

import { useState } from "react";
import type { FilterState, PriceTier } from "@/lib/types";

interface ProductFilterCardProps {
  brands: { name: string; logoUrl?: string }[];
  categoryOptions: { groupLabel: string; options: string[] }[];
  priceOptions: { key: PriceTier; title: string; desc: string }[];
  defaultPriceTier: PriceTier;
  defaultBrands: string[];
  onSubmit: (filter: FilterState) => void;
}

export default function ProductFilterCard({
  brands,
  categoryOptions,
  priceOptions,
  defaultPriceTier,
  defaultBrands,
  onSubmit,
}: ProductFilterCardProps) {
  const [priceTier, setPriceTier] = useState<PriceTier>(defaultPriceTier);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(defaultBrands);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggle = (value: string, current: string[], setter: (next: string[]) => void) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  return (
    <div
      className="w-full max-w-[620px] bg-white px-5 py-5"
      style={{
        borderRadius: "20px",
        boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
      }}
    >
      <p className="text-[16px] font-medium text-[#000]" style={{ letterSpacing: "0.16px" }}>
        정확한 추천을 위해 원하는 조건을 알려주세요.
      </p>

      <div className="mt-5">
        <p className="mb-2 text-[12px] font-medium text-[#777169]" style={{ letterSpacing: "0.14px" }}>
          가격대
        </p>
        <div className="grid grid-cols-3 gap-2">
          {priceOptions.map((item) => {
            const active = priceTier === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPriceTier(item.key)}
                className="cursor-pointer rounded-[16px] px-3 py-3 text-left transition-all"
                style={{
                  backgroundColor: active ? "#4e3fb4" : "#f6f6f6",
                  color: active ? "#fff" : "#000",
                  boxShadow: active ? "rgba(78,50,23,0.04) 0px 6px 16px" : undefined,
                }}
              >
                <p className="text-[13px] font-medium" style={{ letterSpacing: "0.14px" }}>{item.title}</p>
                <p className="mt-1 text-[11px] opacity-80" style={{ letterSpacing: "0.14px", lineHeight: 1.45 }}>{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[12px] font-medium text-[#777169]" style={{ letterSpacing: "0.14px" }}>
          브랜드
        </p>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => {
            const active = selectedBrands.includes(brand.name);
            return (
              <button
                key={brand.name}
                onClick={() => toggle(brand.name, selectedBrands, setSelectedBrands)}
                className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-[12px] transition-all"
                style={{
                  backgroundColor: active ? "rgba(78,63,180,0.08)" : "#f6f6f6",
                  color: active ? "#4e3fb4" : "#4e4e4e",
                  boxShadow: active ? "rgba(0,0,0,0.08) 0px 0px 0px 0.5px" : undefined,
                  letterSpacing: "0.14px",
                }}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] text-[#777169]">
                  {brand.name.slice(0, 1)}
                </span>
                {brand.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {categoryOptions.map((group) => (
          <div key={group.groupLabel}>
            <p className="mb-2 text-[12px] font-medium text-[#777169]" style={{ letterSpacing: "0.14px" }}>
              {group.groupLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const active = selectedOptions.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggle(option, selectedOptions, setSelectedOptions)}
                    className="cursor-pointer rounded-full px-3 py-2 text-[12px] transition-all"
                    style={{
                      backgroundColor: active ? "#000" : "#f6f6f6",
                      color: active ? "#fff" : "#4e4e4e",
                      letterSpacing: "0.14px",
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSubmit({ priceTier, brands: selectedBrands, options: selectedOptions })}
        className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-full bg-black px-5 py-3 text-[14px] font-medium text-white"
        style={{ letterSpacing: "0.16px" }}
      >
        맞춤 추천 보기 →
      </button>
    </div>
  );
}
