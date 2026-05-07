import React, { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface VideoUrlInputProps {
  onVideoChange: (url: string) => void;
}

const VideoUrlInput: React.FC<VideoUrlInputProps> = ({ onVideoChange }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (url.trim()) { onVideoChange(url.trim()); setUrl(""); setError(""); }
    else setError("Enter a URL");
  };

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "0 20px 16px" }}>
      <div style={{ flex: 1 }}>
        <Input placeholder="Video URL (YouTube / VK / Rutube)..." value={url} onChange={(e) => { setUrl(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} error={error} />
      </div>
      <Button variant="purple" size="sm" onClick={handleSubmit}>Change</Button>
    </div>
  );
};

export default VideoUrlInput;
