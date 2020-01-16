#!/usr/bin/env bash
for file in *.json;
do
	newName=`echo $file | sed 's/\([0-9]\{4\}\)\_\([A-Za-z]\+\)\{1\}\.\(json\)/\2\1/gi'`
	fullNewName="semantic-location-history-$newName.ts"
	quicktype $file -o $fullNewName
done


