#!/usr/bin/env bash
set -e

branch=$1
if [[ -z "$branch" ]]; then
  >&2 echo "you need to specify the branch as first parameter";
  exit 99;
fi

npm install
export PM2_HOME=/etc/pm2daemon
# run compile will delete build directory, hence backing up first so that we can rollback
rm -rf build.bak
cp -r build build.bak

# either do the deploy fully or rollback to the previous "binaries"
(
  echo "going to delete datablue_$branch" &&
  pm2 delete "datablue_$branch" | echo &&
  npm run compile &&
  cat build/main.js > /dev/null &&
  echo "build/main.js exists; I assume we are good to deploy new version"
) || (
  rm -rf build &&
  mv build.bak build
)

pm2 start build/main.js --name "datablue_$branch"