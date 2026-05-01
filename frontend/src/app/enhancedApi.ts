import { stringToTag } from "../util/tag";
import { api } from "./api";

export const enhancedApi = api.enhanceEndpoints({
  endpoints: {
    addTagToDocument: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const { documentId, tag } = arg;
        const patchResult = dispatch(
          api.util.updateQueryData("getDocumentTags", documentId, (draft) => {
            draft.tags = [...new Set([...draft.tags, stringToTag(tag)])];
          }),
        );
        try {
          await queryFulfilled;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_err) {
          patchResult.undo();
        }
      },
    },
    removeTagFromDocument: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const { documentId, tag } = arg;
        const patchResult = dispatch(
          api.util.updateQueryData("getDocumentTags", documentId, (draft) => {
            draft.tags = draft.tags.filter(
              (t) => t.key !== stringToTag(tag).key,
            );
          }),
        );
        try {
          await queryFulfilled;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_err) {
          patchResult.undo();
        }
      },
    },
  },
});
