import React from 'react';

type ToastNoticeProps = {
  notice: { type: 'success' | 'error' | 'info'; message: string };
};

export const ToastNotice = ({ notice }: ToastNoticeProps) => {
  return <div className={`toast ${notice.type}`}>{notice.message}</div>;
};
