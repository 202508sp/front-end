# Front End

## Start

### dependencies

- git

1. https://gitforwindows.org/ からダウンロードしてインストールする。
2. Git-<vertion>-64-bit.exe をダブルクリックしてインストールする。
3. Choosing the default editor used by Git で Use 

- node.js / npm

```shell
# nvmをダウンロードしてインストールする：
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Node.jsをダウンロードしてインストールする：
nvm install 20

# Node.jsのバージョンを確認する：
node -v # "v20.18.3"が表示される。
nvm current # "v20.18.3"が表示される。

# npmのバージョンを確認する：
npm -v # "10.8.2"が表示される。
```

- bun
```shell
# PowerShell なら
powershell -c "irm bun.sh/install.ps1 | iex"

# npm を使うなら
npm install -g bun
```

### install

1. リポジトリのクローン

```shell
git clone https://github.com/202508sp/front-end.git
```