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

## 自動検証 (CI)

GitHub Actions の `Bookmarklet checks` は、Push・Pull Request・手動実行時に Node.js 22 で以下を検証します。

- `tab-focus-aid.js` のJavaScript構文
- `bookmarklet.txt` 内の実行コード構文、`javascript:` プレフィックス、1行形式
- `register.html` 内のブックマークURL構文
- HTML内でエスケープされたブックマークURLと `bookmarklet.txt` の完全一致
- v0.3.0で発生した正規表現構文エラーの回帰テスト

ローカルでも実行できます。

```sh
node scripts/check-bookmarklet.cjs
node scripts/regression-test.cjs
```

検査に失敗した場合はGitHub Actionsが失敗します。マージを禁止したい場合は、GitHubのブランチ保護ルールで `verify` を必須チェックに設定してください。構文検査はブラウザ上の動作成功まで保証するものではありません。

## Chromium E2Eテスト (Playwright)

`tests/bookmarklet.spec.cjs` は、実際に配布する `bookmarklet.txt` のJavaScriptをChromiumのページで実行し、以下を確認します。

- 候補管理パネルの表示
- 要素の選択とTabフォーカス、青枠（outline）の表示
- Enter / Space によるクリック
- 特定候補の除外
- 元に戻す機能とイベントリスナーの解除
- パネルの閉じる・再表示

ローカル実行:

```sh
npm install
npx playwright install chromium
npm run test:e2e
```

GitHub Actionsは `verify`（構文検査）と `e2e`（Chromiumブラウザ検査）を並行実行します。失敗時にはレポートをArtifactとして保存します。外部サイトは操作せず、テスト用のローカルHTMLを使います。

## Chromeのブックマーク登録に関する注意

HTMLリンクをブックマークバーへドラッグした際、ChromeがJavaScript URLを保存しない場合があります。`register.html` の「ブックマークレットURLをコピー」を利用し、Chromeのブックマーク編集画面のURL欄に貼り付けてください。保存後のURLが `javascript:` で始まるか確認してください。

※ `register.html` 内で直接動作することと、ブックマークバーへの登録成功は別の問題です。自動検査では直接コピー用のURL文字列も `bookmarklet.txt` と一致するか検査します。

## パネル表示位置と登録方法（修正）

`register.html` 内のリンクをブックマークバーへドラッグ＆ドロップして登録できます。起動時のパネルは、ページ末尾ではなく現在のビューポート右上に固定表示されます。原因は `all:initial` が `position:fixed` を上書きしていたCSS指定順序であり、リセット後に `position:fixed` を設定することで修正しました。

## パネルを閉じてページを操作する

候補の選択後に「選択を反映」を押すと、管理パネルを自動で非表示にします。右上の「×」および「閉じる」でもパネルを非表示にできます。これらはページに設定した `tabindex` やキーボードイベントを解除しません。ブックマークレットを再実行するとパネルを再表示します。設定を取り消したい場合は「すべて元に戻す」を使用します。

**修正理由:** CSSの `all:initial!important` に対して、単純な `style.display = 'none'` は優先順位で負けるため、`style.setProperty('display','none','important')` で確実に非表示にします。閉じる際はページ側へフォーカスを戻します。

## 新機能（v0.4.0 試作）

### Issue報告（Issue #2）
管理画面の「未検出要素を指定」を押してから対象をクリックすると、クリック自体を抑止して構造とCSSの診断内容を編集可能な欄に表示します。Escでキャンセルできます。「報告文コピー」で控えを取得でき、「GitHub Issue画面」で確認ダイアログ後にIssue作成ページを開けます。自動投稿はしません。入力値、DOMテキスト、URL、属性値、HTML全文は診断文に含めません。**必ず送信前に内容を確認してください。**

### ページ内アクション検索（Issue #3）
「アクション検索」で検索欄に名前を入力します。ARIAラベル、title、要素テキスト、サービスカードの見出しから候補を表示し、候補を押すと実際の操作対象にフォーカスします。Enterキーで操作できます。検索はブラウザ内で行い、外部には送信しません。現段階では上限25候補です。

### サイト別常時有効化（Issue #1）
Manifest V3の拡張機能を `extension/` に追加しました。Chromeの `chrome://extensions` で開発者モードを有効にして `extension` ディレクトリを「パッケージ化されていない拡張機能を読み込む」で指定してください。アイコンをクリックし、サイトごとに明示的に権限を許可すると以降のページ読み込み時に自動適用します。初期状態ではどのサイトにもアクセスしません。Chromeウェブストア未公開の試作版です。

ブラウザ固有の動作はGitHub Actionsの結果および手動検証が必要です。
