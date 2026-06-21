const plugin = {
    id: "sample-plugin",
    name: "Sample Plugin",
    description: "Demonstrates nav items, routes, and API access",
    navItems: [
        {
            id: "sample-page",
            path: "/sample",
            label: "Sample",
            icon: (icons) => icons.FaFlask,
            priority: 10,
        },
    ],
    documentInfo: {
        matcher: () => true,
        Render: ({ React, dataApi, document, components }) => {
            // Share the host's RTK Query cache: this is the same query the host's
            // tag panel uses, and the mutations below invalidate/optimistically
            // update it, so both UIs stay in sync without any manual refetch.
            const { data } = dataApi.useGetDocumentTagsQuery(document.id);
            const [addTag, { isLoading: adding }] = dataApi.useAddTagToDocumentMutation();
            const [removeTag, { isLoading: removing }] = dataApi.useRemoveTagFromDocumentMutation();
            const busy = adding || removing;
            const scoreTag = data?.tags.find((t) => t.key === "score");
            const score = scoreTag?.value ? Number(scoreTag.value) : null;
            const setRating = async (value) => {
                if (busy)
                    return;
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
            return React.createElement("div", null, React.createElement("div", { className: "flex items-center gap-2 mb-4" }, React.createElement("h3", {
                className: "text-xs font-semibold text-text-muted uppercase tracking-wider",
            }, "Score"), 
            // Reuse the host's themed Badge instead of styling our own.
            score != null &&
                React.createElement(components.Badge, {
                    onDelete: () => setRating(0),
                    children: `${score} / 5`,
                })), React.createElement("div", { className: "flex gap-1" }, [1, 2, 3, 4, 5].map((star) => React.createElement("button", {
                key: star,
                type: "button",
                disabled: busy,
                onClick: () => setRating(star),
                "aria-label": `Set score to ${star}`,
                className: "text-2xl leading-none transition-colors disabled:opacity-50 " +
                    (score != null && star <= score
                        ? "text-accent"
                        : "text-text-muted hover:text-text-primary"),
            }, score != null && star <= score ? "★" : "☆"))));
        },
    },
    routes: [
        {
            path: "/sample",
            Component: (context) => {
                const { React, api, components } = context;
                const [health, setHealth] = React.useState("loading...");
                const loadHealth = React.useCallback(() => {
                    setHealth("loading...");
                    api
                        .fetch("/health")
                        .then((res) => res.json())
                        .then((data) => setHealth(JSON.stringify(data)))
                        .catch((err) => setHealth(`Error: ${err.message}`));
                }, [api]);
                React.useEffect(() => {
                    loadHealth();
                }, [loadHealth]);
                return React.createElement("div", { className: "p-6" }, React.createElement("h1", { className: "text-2xl font-bold text-text-primary mb-4" }, "Sample Plugin Page"), React.createElement("p", { className: "text-text-secondary mb-2" }, "This page is rendered by a plugin."), 
                // Reuse the host's themed Button instead of styling our own.
                React.createElement(components.Button, {
                    variant: "secondary",
                    onClick: loadHealth,
                    className: "mb-4",
                    children: "Refresh health",
                }), React.createElement("div", { className: "bg-surface-1 p-4 rounded-md" }, React.createElement("p", { className: "text-text-muted text-sm" }, "Backend health: "), React.createElement("code", { className: "text-text-primary" }, health)));
            },
        },
    ],
};
export default plugin;
