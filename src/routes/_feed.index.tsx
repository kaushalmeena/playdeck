import { createFileRoute } from "@tanstack/react-router";
import { SITE, seo } from "../lib/seo";

/** the feed is rendered by the _feed layout; this route only carries its head */
export const Route = createFileRoute("/_feed/")({
	head: () => seo({ title: SITE.tagline, description: SITE.description }),
});
