import { PhoneFrame } from "@/components/helen/PhoneFrame";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <PhoneFrame>{children}</PhoneFrame>;
}
