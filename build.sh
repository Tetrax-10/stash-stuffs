#!/bin/bash

plugins_folder_name="Plugins"
themes_folder_name="Themes"
build_folder_name="builds"
temp_folder_name="dist"

plugins_dir="./$temp_folder_name/$plugins_folder_name"
themes_dir="./$temp_folder_name/$themes_folder_name"
out_dir="./$temp_folder_name/$build_folder_name"

rm -rf "$out_dir"
mkdir -p "$out_dir"

buildPlugin() {
    f=$1

    if grep -q "^#pkgignore" "$f"; then
        return
    fi

    # get the scraper id from the directory name
    dir=$(dirname "$f")
    src_dir=$(echo "$dir" | sed "s|/$temp_folder_name||")
    plugin_id=$(basename "$f" .yml)

    echo "Processing $plugin_id"

    # gets the plugin folder's latest commit
    version=$(git log -n 1 --pretty=format:%h -- "$src_dir"/*)
    updated=$(TZ=UTC0 git log -n 1 --date="format-local:%F %T" --pretty=format:%ad -- "$src_dir"/*)

    # create the zip file
    # copy other files
    zipfile=$(realpath "$out_dir/$plugin_id.zip")

    pushd "$dir" >/dev/null
    zip -r "$zipfile" . >/dev/null
    popd >/dev/null

    name=$(grep "^name:" "$f" | head -n 1 | cut -d' ' -f2- | sed -e 's/\r//' -e 's/^"\(.*\)"$/\1/')
    description=$(grep "^description:" "$f" | head -n 1 | cut -d' ' -f2- | sed -e 's/\r//' -e 's/^"\(.*\)"$/\1/')
    ymlVersion=$(grep "^version:" "$f" | head -n 1 | cut -d' ' -f2- | sed -e 's/\r//' -e 's/^"\(.*\)"$/\1/')
    version="$ymlVersion-$version"
    dep=$(grep "^# requires:" "$f" | cut -c 12- | sed -e 's/\r//')

    # write to index.yml
    echo "- id: $plugin_id
  name: $name
  metadata:
    description: $description
  version: $version
  date: $updated
  path: $plugin_id.zip
  sha256: $(sha256sum "$zipfile" | cut -d' ' -f1)" >>"$out_dir"/index.yml

    # handle dependencies
    if [ ! -z "$dep" ]; then
        echo "  requires:" >>"$out_dir"/index.yml
        for d in ${dep//,/ }; do
            echo "    - $d" >>"$out_dir"/index.yml
        done
    fi

    echo "" >>"$out_dir"/index.yml
}

find $plugins_dir -mindepth 1 -name *.yml | while read file; do
    buildPlugin "$file"
done
find $themes_dir -mindepth 1 -name *.yml | while read file; do
    buildPlugin "$file"
done
