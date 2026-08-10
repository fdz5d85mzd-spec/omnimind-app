import Image from "next/image";

export function Globe() {
  return (
    <div className="relative my-4 flex justify-center">
      <div
        className="pointer-events-none absolute h-[190px] w-[190px] rounded-full blur-2xl"
        style={{ background: "radial-gradient(circle, rgba(242,197,163,0.35), transparent 70%)" }}
      />
      <div className="relative h-[190px] w-[190px] overflow-hidden rounded-[38%]">
        <Image
          src="/helen/globe-hero.png"
          alt="HELEN world"
          width={380}
          height={380}
          priority
          className="h-full w-full scale-110 object-cover"
        />
      </div>
    </div>
  );
}
