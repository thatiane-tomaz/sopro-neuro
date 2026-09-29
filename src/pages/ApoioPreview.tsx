import AbstinenceExtras from "@/components/home/AbstinenceExtras";

/** Prévia temporária do bloco de Hipnoses de Apoio (recolher/expandir). */
export default function ApoioPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(258_60%_97%)] to-white px-4 py-8">
      <div className="mx-auto w-full max-w-[394px]">
        <AbstinenceExtras mode="extras" />
      </div>
    </div>
  );
}
