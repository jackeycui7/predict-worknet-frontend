import { Link } from "wouter";
import { truncateAddress } from "@/lib/format";

export function AgentLink({ address }: { address: string }) {
  return (
    <Link href={`/agents/${address}`}>
      <span
        className="text-foreground hover:text-foreground/60 cursor-pointer font-mono text-[11px] font-light transition-colors"
        data-testid={`agent-link-${address}`}
      >
        {truncateAddress(address)}
      </span>
    </Link>
  );
}

export function MarketLink({ id }: { id: string }) {
  return (
    <Link href={`/markets/${id}`}>
      <span
        className="text-foreground hover:text-foreground/60 cursor-pointer font-mono text-[11px] font-light transition-colors"
        data-testid={`market-link-${id}`}
      >
        {id}
      </span>
    </Link>
  );
}
