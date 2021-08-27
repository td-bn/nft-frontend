import React from "react";

export function Message({ message }) {
  return (
    <div className="alert alert-info" role="alert">
      {message}
    </div>
  );
}
