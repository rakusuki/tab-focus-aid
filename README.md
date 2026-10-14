# Tab Focus Aid

Make likely clickable but keyboard-inaccessible page elements navigable with Tab, with a review-and-select panel.

**クリック可能と推定されるのにTabキーで到達できない要素を、一覧で確認してからキーボード操作可能にするChromeブックマークレット。**

## Features / 機能

- Candidate list with labels, detection reasons and element location / 候補一覧・検出根拠・位置確認
- Search, select all visible, deselect all visible / 検索・一括選択・除外
- Apply explicit selection, Tab / Enter / Space support / 選択反映・キーボード操作
- Restore original attributes and event listeners / 元に戻す
- Rescan dynamic pages / SPA画面の再検出
- No external libraries, APIs or network transmissions / 外部送信なし

## Install / インストール

Open `register.html` in Chrome, drag the button to bookmarks bar and click it on a website.
Alternatively paste the full content of `bookmarklet.txt` into a bookmark URL field.

## Use / 使い方

1. Open target page and run the bookmark.
2. Review and filter candidates. Uncheck elements that should not become Tab stops.
3. Press **選択を反映**.
4. Use Tab and Enter (or Space on button-like items).
5. Run bookmark again to reopen the panel. **すべて元に戻す** restores modifications.

## Detection limitations / 制限

Detection uses `onclick`, ARIA roles, selected `data-*` attributes/classes and `cursor:pointer`.
It cannot reliably inspect JavaScript `addEventListener` registrations or framework delegation.
It may miss clickable elements or falsely detect non-clickable ones. Keyboard activation can also differ from trusted mouse events. Shadow DOM and cross-origin iframes are not scanned.

Changes are temporary on the current document and are lost on reload. No automatic persistence.

## Security & privacy

Runs entirely inside the current page, reads the DOM to list candidates and does **not** call `fetch`, external APIs, or send page contents elsewhere. Bookmarklets execute with the current page's permissions; only run trusted source on pages you are authorized to modify locally.

## Development

Source: `tab-focus-aid.js`. Check syntax with `node --check tab-focus-aid.js`.
Rebuild the bookmark URL from the source using a JavaScript-aware minifier when changing the code. This release includes an unminified one-line registration URL for transparency.

## License

MIT. Copyright (c) 2026 ynishi_works.
## Diagnostic report / 診断コピー（v0.3.0）

各候補の **診断コピー** を押すと、JSON形式のレポートがクリップボードにコピーされます。要素のタグ、祖先タグ、フォーカス状態、検出根拠、関連CSS、サイズを出力します。要素内テキスト、HTML、ページURL、ID、class、フォーム入力値は収集しません。送信は行いません。公開Issueへ貼り付ける前にレポートとスクリーンショットを必ず確認してください。候補一覧に出ない要素は現時点では診断ボタンから選択できません。
