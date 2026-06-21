import type { DocumentInfoPlugin } from "@lars_hagemann/mediaserver-frontend-plugin-types";

// A plugin can be split across as many files as you like. The build bundles
// every local import into a single `dist/index.js`, so relative imports such
// as the one in `index.ts` that pulls in this file resolve at build time.
export const scorePanel: DocumentInfoPlugin = {
  matcher: () => true,
  Render: ({ React, dataApi, document, components }) => {
    // Share the host's RTK Query cache: this is the same query the host's
    // tag panel uses, and the mutations below invalidate/optimistically
    // update it, so both UIs stay in sync without any manual refetch.
    const { data } = dataApi.useGetDocumentTagsQuery(document.id);
    const [addTag, { isLoading: adding }] =
      dataApi.useAddTagToDocumentMutation();
    const [removeTag, { isLoading: removing }] =
      dataApi.useRemoveTagFromDocumentMutation();
    const busy = adding || removing;

    const scoreTag = data?.tags.find((t) => t.key === "score");
    const score = scoreTag?.value ? Number(scoreTag.value) : null;

    const setRating = async (value: number) => {
      if (busy) return;
      if (score != null) {
        await removeTag({
          documentId: document.id,
          tag: `score:${score}`,
        });
      }
      if (value > 0) {
        await addTag({ documentId: document.id, tag: `score:${value}` });
      }
    };

    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { className: "flex items-center gap-2 mb-4" },
        React.createElement(
          "h3",
          {
            className:
              "text-xs font-semibold text-text-muted uppercase tracking-wider",
          },
          "Score",
        ),
        // Reuse the host's themed Badge instead of styling our own.
        score != null &&
          React.createElement(components.Badge, {
            onDelete: () => setRating(0),
            children: `${score} / 5`,
          }),
      ),
      React.createElement(
        "div",
        { className: "flex gap-1" },
        [1, 2, 3, 4, 5].map((star) =>
          React.createElement(
            "button",
            {
              key: star,
              type: "button",
              disabled: busy,
              onClick: () => setRating(star),
              "aria-label": `Set score to ${star}`,
              className:
                "text-2xl leading-none transition-colors disabled:opacity-50 " +
                (score != null && star <= score
                  ? "text-accent"
                  : "text-text-muted hover:text-text-primary"),
            },
            score != null && star <= score ? "★" : "☆",
          ),
        ),
      ),
    );
  },
};
