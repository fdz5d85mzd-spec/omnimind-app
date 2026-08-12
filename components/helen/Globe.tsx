import Image from "next/image";

export function Globe() {
  return (
    <div className="helen-orbit-stage relative mx-auto mb-4 mt-1 flex justify-center">
      <div className="helen-orbit helen-orbit-one" />
      <div className="helen-orbit helen-orbit-two" />
      <span className="helen-orbit-node helen-node-one" />
      <span className="helen-orbit-node helen-node-two" />
      <div className="helen-globe-aura" />
      <div className="helen-globe-core relative overflow-hidden rounded-[38%]">
        <Image
          src="/helen/globe-hero.png"
          alt="HELEN world"
          width={380}
          height={380}
          priority
          className="h-full w-full scale-110 object-cover"
        />
        <div className="helen-globe-scan" />
      </div>
    </div>
  );
}
