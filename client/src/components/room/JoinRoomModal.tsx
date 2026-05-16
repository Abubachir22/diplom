import React, { useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (password?: string) => void;
  isPrivate: boolean;
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onClose, onJoin, isPrivate }) => {
  const [password, setPassword] = useState("");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Room">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {isPrivate && (
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter room password"
          />
        )}
        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button variant="primary" onClick={() => onJoin(isPrivate ? password : undefined)} style={{ flex: 2 }}>Join</Button>
        </div>
      </div>
    </Modal>
  );
};

export default JoinRoomModal;