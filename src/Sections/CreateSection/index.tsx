import React, { useState } from 'react';
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

  const [file, setFile] = useState<File | null>(null);

  const [semanticHistory, setSemanticHistory] = useState<any | undefined>(undefined);

  const parse = async () => {
    if (file === undefined || file === null) {
      console.error("You must select a file first.");
      return;
    };
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

    console.log(`${testMonth} ${testYear}`);

    const specialName = `${testDate.toLocaleString('default', { month: 'long' })}${testYear}`.toUpperCase();
    import(`../../Utilities/SemanticLocationHistory/${testYear}/semantic-location-history-${specialName}`).then((test: any) => {
      const converted = test.Convert[`toSemanticLocationHistory${specialName}`](textContent);
      setSemanticHistory(converted);
    });
  }


  const visits = [];

  if (semanticHistory !== undefined) {
    const timelineObjects = semanticHistory.timelineObjects;
    for (const to of timelineObjects) {
      const visit = to.placeVisit;
      if (visit !== undefined) {
        console.log(visit);
        const lat = visit.centerLatE7;
        const long = visit.centerLngE7;
        const loc = visit.location;
        visits.push(
          <CircleMarker radius={3} center={{ lat: lat / 10000000.0, lng: long / 10000000.0 }} >
            <Popup>
              <p>ID: {loc.placeId}</p>
              <p>Name: {loc.name}</p>
              <p>Address: {loc.address}</p>
            </Popup>
          </CircleMarker>
        );
      }
    }
  }


  return (
    <section>

      <div>
        <Button variant="contained" component="label">
          <span>Select File</span>
          <input type="file" style={{ display: "none" }} onChange={(event) => {
            const files = event.currentTarget.files;
            if (files === null || files.length < 1) return;
            setFile(files[0]);
          }} />
        </Button>

        <Button variant="contained" component="label" onClick={parse}>
          <span>Parse</span>
        </Button>
      </div>

      <div>
        <Map center={{ lat: 0, lng: 0 }} zoom={2} style={{ height: '100vh', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
          />
          {visits}
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

