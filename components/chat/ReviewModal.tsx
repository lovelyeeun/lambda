"use client";

import { Star, X } from "lucide-react";

interface ReviewItem {
  id: string;
  author: string;
  source: string;
  rating: number;
  date: string;
  text: string;
}

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  rating: number;
  reviewCount: number;
  reviews: ReviewItem[];
}

function renderStars(count: number) {
  return Array.from({ length: 5 }).map((_, idx) => (
    <Star
      key={idx}
      size={16}
      strokeWidth={1.75}
      fill={idx < count ? "#ffcc33" : "#e5e7eb"}
      color={idx < count ? "#ffcc33" : "#e5e7eb"}
    />
  ));
}

export default function ReviewModal({ open, onClose, productName, rating, reviewCount, reviews }: ReviewModalProps) {
  if (!open) return null;

  const buckets = [5, 4, 3, 2, 1].map((score) => {
    const count = Math.max(1, Math.round((reviewCount / 5) * (score === 5 ? 2.4 : score === 4 ? 0.8 : score === 3 ? 0.12 : score === 2 ? 0.04 : 0.03)));
    return { score, count };
  });
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count));

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[rgba(0,0,0,0.48)] p-4">
      <div
        className="w-full max-w-[920px] overflow-hidden bg-white"
        style={{ borderRadius: "20px", boxShadow: "rgba(0,0,0,0.18) 0px 20px 48px", maxHeight: "88vh" }}
      >
        <div className="flex items-start justify-between border-b border-[rgba(0,0,0,0.05)] px-8 py-6">
          <div>
            <p className="text-[15px] text-[#777169]">상품리뷰</p>
            <h2 className="mt-1 text-[34px] font-light text-[#000]" style={{ letterSpacing: "-0.6px" }}>{productName}</h2>
            <p className="mt-2 text-[13px] text-[#ef4444]">체험단, 광고성 후기 제외</p>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6f6f6]">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-[320px_1fr] gap-8 border-b border-[rgba(0,0,0,0.05)] px-8 py-6">
          <div className="flex flex-col items-center justify-center">
            <div className="text-[52px] font-semibold text-[#2f3542]">{rating.toFixed(1)}<span className="ml-2 text-[22px] text-[#6b7280]">({reviewCount})</span></div>
            <div className="mt-3 flex gap-1">{renderStars(Math.round(rating))}</div>
            <div className="mt-4 rounded-full bg-[#f3f4f6] px-4 py-2 text-[13px] text-[#4e4e4e]">광고제외</div>
          </div>

          <div className="space-y-4">
            {buckets.map((bucket) => (
              <div key={bucket.score} className="flex items-center gap-4">
                <span className="w-4 text-[14px] text-[#4e4e4e]">{bucket.score}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]">
                  <div className="h-full rounded-full bg-[#ffcc33]" style={{ width: `${(bucket.count / maxCount) * 100}%` }} />
                </div>
                <span className="w-20 text-right text-[14px] text-[#9ca3af]">{bucket.count}개</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-h-[48vh] overflow-y-auto px-8 py-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-[rgba(0,0,0,0.06)] py-6 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e5e7eb] text-[14px] text-[#777169]">
                  {review.author.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#2f3542]">{review.author}</span>
                    <span className="rounded-[10px] bg-[#f3f4f6] px-3 py-1 text-[12px] text-[#6b7280]">{review.source}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                    <span className="text-[13px] text-[#9ca3af]">{review.date}</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[16px] leading-[1.7] text-[#2f3542]" style={{ letterSpacing: "0.14px" }}>
                {review.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
