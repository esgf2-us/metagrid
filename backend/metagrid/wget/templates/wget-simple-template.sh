#!/bin/bash

download_files=(
{% spaceless %}{% for filename, file in files.items %}'{{file.url}}'
{% endfor %}{% endspaceless %}
)

for i in "${download_files[@]}"
do
   wget $i
done
