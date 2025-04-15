import type {TokenList, TokenListItem} from '../types/TokenList';

export type GetTokenListOptions = {};

export interface TokenListProvider<TItem = TokenListItem> {
  getTokenList(options?: GetTokenListOptions): Promise<TokenList<TItem>>;
}
