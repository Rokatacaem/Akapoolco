'use client';

import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CopyButton({ path }: { path: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const url = `${window.location.origin}${path}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Enlace copiado al portapapeles");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="secondary"
            size="icon"
            className="shrink-0 bg-slate-800 text-slate-400 hover:text-white"
            onClick={handleCopy}
            title="Copiar Enlace"
        >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
    );
}
