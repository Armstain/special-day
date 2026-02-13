const SPECIAL_DAY_BASE = "/special-day";

function normalizeBasePath(basePath: string): string {
    if (!basePath || basePath === "/") return "";
    return basePath.startsWith("/") ? basePath.replace(/\/+$/, "") : `/${basePath.replace(/\/+$/, "")}`;
}

function getPathnameBasePath(): string {
    if (typeof window === "undefined") return "";
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "";
    return `/${segments[0]}`;
}

export function getAudioCandidates(fileName: string): string[] {
    const envBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");
    const pathnameBasePath = normalizeBasePath(getPathnameBasePath());
    const sanitizedFileName = fileName.replace(/^\/+/, "");

    const candidates = [
        envBasePath ? `${envBasePath}/${sanitizedFileName}` : "",
        `/${sanitizedFileName}`,
        `${SPECIAL_DAY_BASE}/${sanitizedFileName}`,
        pathnameBasePath ? `${pathnameBasePath}/${sanitizedFileName}` : "",
    ];

    return Array.from(new Set(candidates.filter(Boolean)));
}

export function createAudioWithFallback(fileName: string): HTMLAudioElement {
    const candidates = getAudioCandidates(fileName);
    const audio = new Audio(candidates[0] ?? `/${fileName.replace(/^\/+/, "")}`);
    let candidateIndex = 0;

    const handleError = () => {
        if (candidateIndex >= candidates.length - 1) return;
        candidateIndex += 1;
        audio.src = candidates[candidateIndex];
        audio.load();
    };

    audio.addEventListener("error", handleError);
    return audio;
}
