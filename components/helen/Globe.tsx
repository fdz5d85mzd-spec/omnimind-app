import Image from "next/image";

export function Globe() {
  return (
    <div className="helen-orbit-stage relative mx-auto mb-4 mt-1 flex justify-center">
      <div className="helen-orbit helen-orbit-one" />
      <div className="helen-orbit helen-orbit-two" />
      <span className="helen-orbit-node helen-node-one" />
      <span className="helen-orbit-node helen-node-two" />
      <div className="helen-globe-aura" />
      <div className="helen-globe-core relative">
        <Image
          src="/helen/mascot/helen-v1.png"
          alt="Helen, the friendly AI robot"
          width={1254}
          height={1254}
          priority
          className="h-full w-full object-contain drop-shadow-[0_24px_30px_rgba(28,145,255,.28)]"
        />
      </div>
    </div>
  );
}
