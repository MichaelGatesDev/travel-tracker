import React, { useState, useEffect } from 'react';
import { Button } from "@material-ui/core";

import "leaflet/dist/leaflet.css";
import "leaflet/dist/leaflet";
import Leaflet from "leaflet";
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  Map,
  TileLayer,
  Marker,
  CircleMarker,
  Popup,
  Polyline,
} from "react-leaflet";

import { JSONHelper } from "../../Utilities/json-helper";

let DefaultIcon = Leaflet.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
});
Leaflet.Marker.prototype.options.icon = DefaultIcon;

export const CreateSection: React.FC = () => {

  const [semanticFiles, setSemanticFiles] = useState<FileList | null>(null);
  const [semantics, setSemantics] = useState<any[]>([]);

  useEffect(() => {
  }, []);

  const parse = async (): Promise<void> => {
    if (semanticFiles === undefined || semanticFiles === null || semanticFiles.length <= 0) {
      console.error("You must select files first.");
      return;
    }

    setSemantics([]);
    let newSemantics = [];
    for (let i = 0; i < semanticFiles.length; i++) {
      const file = semanticFiles[i];
      const semantic = await loadSemantic(file);
      newSemantics.push(semantic);
    }
    setSemantics(newSemantics);
  };

  const loadSemantic = async (file: File): Promise<any> => {
    console.log(`Loading ${file.name}...`);
    const textContent: string = await fetch(URL.createObjectURL(file)).then(response => response.text());

    let testTimestamp = "";
    {
      const testJson = JSON.parse(textContent);
      const timestamps = JSONHelper.findValuesHelper(testJson, "startTimestampMs");
      if (timestamps.length <= 0) {
        console.error("Couldn't find any timestamps to match file format from.");
        return;
      }
      testTimestamp = timestamps[0];
    }
    const testDate = new Date(parseInt(testTimestamp));
    const testMonth = testDate.getUTCMonth();
    const testYear = testDate.getUTCFullYear();

    if (testYear === 2015 && testMonth < 6) {
      console.error(`Files from before July 2015 are not yet supported.`);
      return;
    }

    const specialName = `${testDate.toLocaleString('default', { month: 'long' })}${testYear}`.toUpperCase();
    const dynamicImport = await import(`../../Utilities/SemanticLocationHistory/${testYear}/semantic-location-history-${specialName}`);
    const converted = dynamicImport.Convert[`toSemanticLocationHistory${specialName}`](textContent);

    console.log(`Loaded ${file.name}!`);
    return converted;
  };

  const createActivityDisplays = () => {
    let results = [];
    for (const semantic of semantics) {
      const objects = semantic.timelineObjects;
      for (const obj of objects) {
        const activitySegment = obj.activitySegment;
        if (activitySegment === undefined) continue;
        const startLoc = activitySegment.startLocation;
        const endLoc = activitySegment.endLocation;
        if (startLoc === undefined || endLoc === undefined) continue;
        if(startLoc.latitudeE7 === undefined || startLoc.longitudeE7 === undefined) continue;
        if(endLoc.latitudeE7 === undefined || endLoc.longitudeE7 === undefined) continue;
        const startLat = startLoc.latitudeE7 / 10000000.0;
        const startLong = startLoc.longitudeE7 / 10000000.0;
        const endLat = endLoc.latitudeE7 / 10000000.0;
        const endLong = endLoc.longitudeE7 / 10000000.0;
        const confidence = activitySegment.confidence;
        const activities = activitySegment.activities;
        results.push(
          <Polyline
            positions={
              [
                { lat: startLat, lng: startLong },
                { lat: endLat, lng: endLong },
              ]
            }
          >
            <Popup>
              <p>Activities: {activities.map((activity: any) => activity.activityType).join(", ")}</p>
              <p>Confidence: {confidence}</p>
            </Popup>
          </Polyline>
        );
      }
    }
    return results;

    // let results = [];
    // for (const semantic of semantics) {
    //   const timelineObjects = semantic.timelineObjects;
    //   for (const to of timelineObjects) {
    //     const visit = to.placeVisit;
    //     if (visit === undefined) continue;

    //     const lat = visit.centerLatE7;
    //     const long = visit.centerLngE7;
    //     const loc = visit.location;
    //     results.push(
    //       <CircleMarker radius={3} center={{ lat: lat / 10000000.0, lng: long / 10000000.0 }} >
    //         <Popup>
    //           <p>ID: {loc.placeId}</p>
    //           <p>Name: {loc.name}</p>
    //           <p>Address: {loc.address}</p>
    //         </Popup>
    //       </CircleMarker>
    //     );
    //   }
    // }
    // return results;
  };

  let activities: JSX.Element[] = [];
  if (semantics.length > 0) {
    activities = createActivityDisplays();
    console.log("creating activities");
  }

  return (
    <section>

      <div style={{ marginBottom: 10 }}>
        <Button variant="contained" component="label">
          <span>Select File</span>
          <input type="file" multiple accept=".json" style={{ display: "none" }} onChange={(event) => {
            const files = event.currentTarget.files;
            if (files === null || files.length < 1) return;
            setSemanticFiles(files);
          }} />
        </Button>

        <Button variant="contained" component="label" onClick={parse}>
          <span>Parse</span>
        </Button>
      </div>

      <div>
        <Map center={{ lat: 0, lng: 0 }} zoom={3} style={{ height: '800px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
          />

          {activities}

          {/* {semanticHistory !== undefined && (
            semanticHistory.timelineObjects.map((obj: any, idx: number) => {
              const segment = obj.activitySegment;
              if (segment !== undefined) {
                const startLoc = segment.startLocation;
                const endLoc = segment.endLocation;
                const confidence = segment.confidence;
                const activities = segment.activities;
                return (
                  <Polyline positions={
                    [
                      { lat: startLoc.latitudeE7 / 10000000.0, lng: startLoc.longitudeE7 / 10000000.0 },
                      { lat: endLoc.latitudeE7 / 10000000.0, lng: endLoc.longitudeE7 / 10000000.0 },
                    ]
                  }
                  >
                    <Popup>
                      <p>Activities: {activities.map((activity: any) => activity.activityType).join(", ")}</p>
                      <p>Confidence: {confidence}</p>
                    </Popup>
                  </Polyline>
                );
              }
              return null;
            })
          )} */}
        </Map>
      </div>

    </section>
  );
};

