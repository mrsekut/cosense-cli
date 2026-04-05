import md2sb from "md2sb";

export async function markdownToScrapbox(markdown: string): Promise<string> {
  return await md2sb(markdown);
}
