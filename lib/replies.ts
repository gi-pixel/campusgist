export type RawReply = {
  id: string
  post_id: string
  parent_id: string | null
  author_id: string
  content: string
  created_at: string
  avatar_emoji?: string | null
  nickname?: string | null
}

export type ReplyNode = RawReply & {
  children: ReplyNode[]
  depth: number
}

// Build a tree from a flat list. Orphaned replies (parent not in the list,
// e.g. because the parent was deleted) get promoted to top-level.
export function buildReplyTree(replies: RawReply[]): ReplyNode[] {
  const byId = new Map<string, ReplyNode>()
  for (const r of replies) {
    byId.set(r.id, { ...r, children: [], depth: 0 })
  }

  const roots: ReplyNode[] = []
  for (const r of replies) {
    const node = byId.get(r.id)!
    if (r.parent_id && byId.has(r.parent_id)) {
      byId.get(r.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Assign depth (capped for display; the tree can be arbitrary depth)
  function assignDepth(nodes: ReplyNode[], depth: number) {
    for (const n of nodes) {
      n.depth = depth
      assignDepth(n.children, depth + 1)
    }
  }
  assignDepth(roots, 0)

  // Sort: roots by created_at asc; children by created_at asc
  const sort = (nodes: ReplyNode[]) => {
    nodes.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    for (const n of nodes) sort(n.children)
  }
  sort(roots)

  return roots
}

// Count all descendants of a node (used for the "hide thread" label)
export function countDescendants(node: ReplyNode): number {
  let n = 0
  for (const c of node.children) n += 1 + countDescendants(c)
  return n
}