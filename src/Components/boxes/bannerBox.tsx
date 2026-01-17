import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

interface Banner {
  imageUrl: string;
  highlight?: string;
  description?: string;
  link?: string;
}

interface BannerBoxProps {
  banners: Banner[];
  totalBanners: number;
}

const BannerBox: React.FC<BannerBoxProps> = ({ banners, totalBanners }) => {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const navigate = useNavigate();

  // Auto-advance banner every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBannerIndex((prevIndex) =>
        prevIndex === totalBanners - 1 ? 0 : prevIndex + 1,
      );
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [totalBanners]);

  const handleBannerClick = (e: React.MouseEvent) => {
    // Prevent click if user clicked on navigation buttons
    if ((e.target as Element).closest("button")) {
      return;
    }

    const currentBanner = banners[activeBannerIndex];
    if (currentBanner.link) {
      if (currentBanner.link.startsWith("http")) {
        window.open(currentBanner.link, "_blank");
      } else {
        navigate(currentBanner.link);
      }
    }
  };

  return (
    <div className="relative bg-gray-800 text-white w-full h-full rounded-3xl overflow-hidden">
      <div
        className={`relative w-full h-full ${
          banners[activeBannerIndex].link ? "cursor-pointer" : ""
        }`}
        onClick={handleBannerClick}
      >
        <div className="absolute inset-0 z-1 bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/70 to-transparent rounded-lg" />

        <img
          src={banners[activeBannerIndex].imageUrl}
          alt="Banner"
          className="relative w-full h-full object-cover rounded-lg"
        />

        <div className="absolute md:bottom-20 bottom-5 left-4 md:px-4 px-2 md:pb-4 z-2">
          <div className="text-lg md:text-xl font-serif">
            {banners[activeBannerIndex].highlight}
            {banners[activeBannerIndex].link && (
              <span className="ml-2">
                <FontAwesomeIcon
                  icon={faExternalLinkAlt}
                  className="text-sm opacity-70 inline-block"
                  style={{ verticalAlign: "middle" }}
                />
              </span>
            )}
          </div>
          <p className="text-sm md:text-sm mt-2 hidden md:block">
            {banners[activeBannerIndex].description}
          </p>
        </div>

        {/* {banners[activeBannerIndex].link && (
          <div className="absolute top-4 right-4 bg-black/50 text-white text-xs py-1 px-2 rounded-full z-10">
            Click to view
          </div>
        )} */}
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveBannerIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeBannerIndex
                ? "bg-white"
                : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerBox;
