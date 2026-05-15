import React, { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useTranslation } from "../../i18n/LanguageContext";

interface VideoUrlInputProps {
  onVideoChange: (url: string) => void;
}

const VideoUrlInput: React.FC<VideoUrlInputProps> = ({ onVideoChange }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const handleSubmit = () => {
    if (url.trim()) { onVideoChange(url.trim()); setUrl(""); setError(""); }
    else setError("Enter a URL");
  };

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "0 20px 16px" }}>
      <div style={{ flex: 1 }}>
        <Input placeholder={t('room.videoUrlPlaceholder')} value={url} onChange={(e) => { setUrl(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} error={error} />
      </div>
      <Button variant="purple" size="sm" onClick={handleSubmit}>{t('room.changeVideo')}</Button>
    </div>
  );
};

export default VideoUrlInput;