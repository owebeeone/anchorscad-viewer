import { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperInstance } from "swiper";
import "swiper/css";

interface Tab<T extends string> {
  name: T;
  tab_title: string;
}

interface SlidingTabsProps<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
  setActiveTab: (name: T) => void;
}

export default function SlidingTabs<T extends string>({
  tabs,
  activeTab,
  setActiveTab,
}: SlidingTabsProps<T>) {
  const swiperRef = useRef<SwiperInstance | null>(null);

  useEffect(() => {
    if (swiperRef.current) {
      const activeIndex = tabs.findIndex((tab) => tab.name === activeTab);
      if (activeIndex !== -1) {
        swiperRef.current.slideTo(activeIndex);
      }
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    // Initial "bump" animation to show scrollability
    if (swiperRef.current) {
      setTimeout(() => {
        if (swiperRef.current) {
            swiperRef.current.slideNext(100);
            setTimeout(() => {
                if (swiperRef.current) {
                    swiperRef.current.slidePrev(100);
                }
            }, 100);
        }
      }, 500);
    }
  }, []);

  return (
    <div className="relative sliding-tabs-container bg-gray-800">
      <div className="selection-indicator"></div>
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        slidesPerView={"auto"}
        centeredSlides={true}
        onSlideChange={(swiper) => {
          const activeIndex = swiper.activeIndex;
          if (tabs[activeIndex]) {
            setActiveTab(tabs[activeIndex].name);
          }
        }}
        className="py-2"
      >
        {tabs.map((tab) => (
          <SwiperSlide key={tab.name} style={{ width: "auto" }}>
            <button
              onClick={() => setActiveTab(tab.name)}
              className={`px-3 py-1 text-sm rounded-md transition-colors truncate ${
                activeTab === tab.name
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.tab_title}
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
