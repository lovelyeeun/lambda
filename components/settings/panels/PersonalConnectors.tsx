"use client";

import { useState } from "react";
import { Check, X, ExternalLink } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  letterIcon: string;
  color: string;
  connected: boolean;
  connectedEmail?: string;
}

const services: Service[] = [
  {
    id: "slack",
    name: "Slack",
    description: "주문 알림, 승인 요청을 슬랙 채널로 받습니다.",
    letterIcon: "S",
    color: "#611f69",
    connected: true,
    connectedEmail: "one@rawlabs.io",
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    description: "배송 예정일, 회의 일정을 캘린더에 자동 등록합니다.",
    letterIcon: "G",
    color: "#4285f4",
    connected: true,
    connectedEmail: "one@rawlabs.io",
  },
  {
    id: "sweettrackerw",
    name: "스위트트래커",
    description: "배송 정보를 실시간으로 확인하고 관리합니다.",
    letterIcon: "S",
    color: "#f97316",
    connected: false,
  },
];

export default function PersonalConnectors() {
  const [serviceStates, setServiceStates] = useState<Record<string, boolean>>(
    services.reduce((acc, s) => ({ ...acc, [s.id]: s.connected }), {})
  );

  const totalServices = services.length;
  const connectedCount = Object.values(serviceStates).filter(Boolean).length;

  const handleConnectionToggle = (serviceId: string) => {
    setServiceStates((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  const getServiceState = (service: Service) => {
    return serviceStates[service.id];
  };

  return (
    <div className="max-w-[500px]">
      {/* Title & Description */}
      <h2 className="text-[18px] font-semibold mb-1" style={{ letterSpacing: "-0.2px" }}>
        내 연결
      </h2>
      <p className="text-[13px] text-[#666] mb-6">
        회사에서 활성화한 서비스에 내 계정을 연결하세요.
      </p>

      {/* Summary Card */}
      <div
        className="mb-6 p-4"
        style={{
          borderRadius: "12px",
          boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
          backgroundColor: "#fafafa",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold text-[#000]">
              {totalServices}개 서비스 중 {connectedCount}개 연결됨
            </p>
            <p className="text-[12px] text-[#999] mt-1">
              모든 서비스를 연결하여 더 나은 경험을 누리세요.
            </p>
          </div>
          {/* Progress Indicator */}
          <div className="shrink-0">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-semibold"
              style={{
                backgroundColor: connectedCount === totalServices ? "#d1fae5" : "#f3f4f6",
                color: connectedCount === totalServices ? "#059669" : "#6b7280",
              }}
            >
              {connectedCount}/{totalServices}
            </div>
          </div>
        </div>
      </div>

      {/* Service Cards */}
      <div className="flex flex-col gap-3">
        {services.map((service) => {
          const isConnected = getServiceState(service);
          return (
            <div
              key={service.id}
              className="p-4 flex items-start gap-3"
              style={{
                borderRadius: "12px",
                boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                backgroundColor: "#fff",
              }}
            >
              {/* Icon Circle */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-semibold text-white shrink-0 mt-0.5"
                style={{ backgroundColor: service.color }}
              >
                {service.letterIcon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[14px] font-medium text-[#000]">{service.name}</p>
                  {isConnected && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-white"
                      style={{ backgroundColor: "#10b981" }}
                    >
                      <Check size={12} strokeWidth={3} />
                      연결됨
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#777] mb-2">{service.description}</p>
                {isConnected && service.connectedEmail && (
                  <p className="text-[12px] text-[#999]">{service.connectedEmail}</p>
                )}
              </div>

              {/* Button */}
              <button
                onClick={() => handleConnectionToggle(service.id)}
                className="shrink-0 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors active:opacity-75"
                style={{
                  backgroundColor: isConnected ? "#fecaca" : "#e5e7eb",
                  color: isConnected ? "#7f1d1d" : "#1f2937",
                }}
              >
                {isConnected ? "연결 해제" : "연결하기"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Text */}
      <p className="text-[12px] text-[#999] mt-6 text-center">
        여기에 표시되는 서비스는 회사 관리자가 활성화한 서비스입니다.
      </p>
    </div>
  );
}
