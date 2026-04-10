import { Link } from "wouter";
import { truncateAddress } from "@/lib/format";

export function AgentLink({ address }: { address: string }) {
  return (
    <Link href={`/agents/${address}`}>
      <span
        className="text-primary hover:underline cursor-pointer font-mono text-xs"
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
        className="text-primary hover:underline cursor-pointer font-mono text-xs"
        data-testid={`market-link-${id}`}
      >
        {id}
      </span>
    </Link>
  );
}
