# オリジナルのピクセル素材

このフォルダのSVGは `tools/generate_pixel_assets.py` で自作した矩形ベースのドット絵です。外部画像・外部フォント・既存作品のキャラクターや衣装は使用していません。SVGは静的に同梱しているため、ゲームの起動・公開時に生成処理は不要です。

- `school-{spring,summer,autumn,winter}.svg`：4季節の高校風景（320×180）
- `stage-{baseball,band,art}.svg`：3部活の大会会場（320×100）
- `baseball.svg`・`band.svg`・`art.svg`：部活のアイコン
- `face-{support,diligent,free,coach}.svg`：恋愛相手3人と監督・顧問の顔（24×24）
- `runner.svg`：男子高校生の進行ゲージ用キャラクター（20×26）
- その他：コマンド、未解放、トロフィー、卒業のアイコン（16×16）

差し替える場合は既存ファイル名を使うか、`js/presentation.js` の素材ルート・部活マニフェスト・`art()` の参照先を変更してください。人物は `face-<恋愛タイプID>.svg` の命名で対応しています。ゲームルール側の `js/config.js` を変える必要はありません。

生成元を修正して再生成する場合：

```sh
python3 tools/generate_pixel_assets.py
```
