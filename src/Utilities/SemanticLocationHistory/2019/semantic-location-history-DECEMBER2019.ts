// To parse this data:
//
//   import { Convert, SemanticLocationHistoryDECEMBER2019 } from "./file";
//
//   const semanticLocationHistoryDECEMBER2019 = Convert.toSemanticLocationHistoryDECEMBER2019(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface SemanticLocationHistoryDECEMBER2019 {
    timelineObjects: TimelineObject[];
}

export interface TimelineObject {
    placeVisit?:      PlaceVisit;
    activitySegment?: ActivitySegment;
}

export interface ActivitySegment {
    startLocation:      StartLocation;
    endLocation:        EndLocation;
    duration:           Duration;
    distance?:          number;
    activityType:       string;
    confidence:         Confidence;
    activities:         Activity[];
    waypointPath?:      WaypointPath;
    simplifiedRawPath?: SimplifiedRawPath;
    transitPath?:       TransitPath;
}

export interface Activity {
    activityType: string;
    probability:  number;
}
export enum Confidence {
    High = "HIGH",
    Low = "LOW",
    Medium = "MEDIUM",
}

export interface Duration {
    startTimestampMs: string;
    endTimestampMs:   string;
}

export interface EndLocation {
    latitudeE7?:   number;
    longitudeE7?:  number;
    placeId?:      string;
    address?:      string;
    name?:         string;
    sourceInfo?:   SourceInfo;
    semanticType?: string;
}

export interface SourceInfo {
    deviceTag: number;
}

export interface SimplifiedRawPath {
    points: Point[];
}

export interface Point {
    latE7:          number;
    lngE7:          number;
    timestampMs:    string;
    accuracyMeters: number;
}

export interface StartLocation {
    latitudeE7:  number;
    longitudeE7: number;
}

export interface TransitPath {
    transitStops: EndLocation[];
    name:         string;
    hexRgbColor:  string;
}

export interface WaypointPath {
    waypoints: { [key: string]: number }[];
}

export interface PlaceVisit {
    location:        EndLocation;
    duration:        Duration;
    placeConfidence: PlaceConfidence;
    centerLatE7?:    number;
    centerLngE7?:    number;
    childVisits?:    ChildVisit[];
}

export interface ChildVisit {
    location:         EndLocation;
    duration?:        Duration;
    placeConfidence?: PlaceConfidence;
    centerLatE7?:     number;
    centerLngE7?:     number;
}

export enum PlaceConfidence {
    HighConfidence = "HIGH_CONFIDENCE",
    LowConfidence = "LOW_CONFIDENCE",
    MediumConfidence = "MEDIUM_CONFIDENCE",
    UserConfirmed = "USER_CONFIRMED",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toSemanticLocationHistoryDECEMBER2019(json: string): SemanticLocationHistoryDECEMBER2019 {
        return cast(JSON.parse(json), r("SemanticLocationHistoryDECEMBER2019"));
    }

    public static semanticLocationHistoryDECEMBER2019ToJson(value: SemanticLocationHistoryDECEMBER2019): string {
        return JSON.stringify(uncast(value, r("SemanticLocationHistoryDECEMBER2019")), null, 2);
    }
}

function invalidValue(typ: any, val: any): never {
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`);
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        var map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        var map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        var l = typs.length;
        for (var i = 0; i < l; i++) {
            var typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(typ: any, val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        var result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(typ, val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "SemanticLocationHistoryDECEMBER2019": o([
        { json: "timelineObjects", js: "timelineObjects", typ: a(r("TimelineObject")) },
    ], false),
    "TimelineObject": o([
        { json: "placeVisit", js: "placeVisit", typ: u(undefined, r("PlaceVisit")) },
        { json: "activitySegment", js: "activitySegment", typ: u(undefined, r("ActivitySegment")) },
    ], false),
    "ActivitySegment": o([
        { json: "startLocation", js: "startLocation", typ: r("StartLocation") },
        { json: "endLocation", js: "endLocation", typ: r("EndLocation") },
        { json: "duration", js: "duration", typ: r("Duration") },
        { json: "distance", js: "distance", typ: u(undefined, 0) },
        { json: "activityType", js: "activityType", typ: "" },
        { json: "confidence", js: "confidence", typ: r("Confidence") },
        { json: "activities", js: "activities", typ: a(r("Activity")) },
        { json: "waypointPath", js: "waypointPath", typ: u(undefined, r("WaypointPath")) },
        { json: "simplifiedRawPath", js: "simplifiedRawPath", typ: u(undefined, r("SimplifiedRawPath")) },
        { json: "transitPath", js: "transitPath", typ: u(undefined, r("TransitPath")) },
    ], false),
    "Activity": o([
        { json: "activityType", js: "activityType", typ: "" },
        { json: "probability", js: "probability", typ: 3.14 },
    ], false),
    "Duration": o([
        { json: "startTimestampMs", js: "startTimestampMs", typ: "" },
        { json: "endTimestampMs", js: "endTimestampMs", typ: "" },
    ], false),
    "EndLocation": o([
        { json: "latitudeE7", js: "latitudeE7", typ: u(undefined, 0) },
        { json: "longitudeE7", js: "longitudeE7", typ: u(undefined, 0) },
        { json: "placeId", js: "placeId", typ: u(undefined, "") },
        { json: "address", js: "address", typ: u(undefined, "") },
        { json: "name", js: "name", typ: u(undefined, "") },
        { json: "sourceInfo", js: "sourceInfo", typ: u(undefined, r("SourceInfo")) },
        { json: "semanticType", js: "semanticType", typ: u(undefined, "") },
    ], false),
    "SourceInfo": o([
        { json: "deviceTag", js: "deviceTag", typ: 0 },
    ], false),
    "SimplifiedRawPath": o([
        { json: "points", js: "points", typ: a(r("Point")) },
    ], false),
    "Point": o([
        { json: "latE7", js: "latE7", typ: 0 },
        { json: "lngE7", js: "lngE7", typ: 0 },
        { json: "timestampMs", js: "timestampMs", typ: "" },
        { json: "accuracyMeters", js: "accuracyMeters", typ: 0 },
    ], false),
    "StartLocation": o([
        { json: "latitudeE7", js: "latitudeE7", typ: 0 },
        { json: "longitudeE7", js: "longitudeE7", typ: 0 },
    ], false),
    "TransitPath": o([
        { json: "transitStops", js: "transitStops", typ: a(r("EndLocation")) },
        { json: "name", js: "name", typ: "" },
        { json: "hexRgbColor", js: "hexRgbColor", typ: "" },
    ], false),
    "WaypointPath": o([
        { json: "waypoints", js: "waypoints", typ: a(m(0)) },
    ], false),
    "PlaceVisit": o([
        { json: "location", js: "location", typ: r("EndLocation") },
        { json: "duration", js: "duration", typ: r("Duration") },
        { json: "placeConfidence", js: "placeConfidence", typ: r("PlaceConfidence") },
        { json: "centerLatE7", js: "centerLatE7", typ: u(undefined, 0) },
        { json: "centerLngE7", js: "centerLngE7", typ: u(undefined, 0) },
        { json: "childVisits", js: "childVisits", typ: u(undefined, a(r("ChildVisit"))) },
    ], false),
    "ChildVisit": o([
        { json: "location", js: "location", typ: r("EndLocation") },
        { json: "duration", js: "duration", typ: u(undefined, r("Duration")) },
        { json: "placeConfidence", js: "placeConfidence", typ: u(undefined, r("PlaceConfidence")) },
        { json: "centerLatE7", js: "centerLatE7", typ: u(undefined, 0) },
        { json: "centerLngE7", js: "centerLngE7", typ: u(undefined, 0) },
    ], false),
    "Confidence": [
        "HIGH",
        "LOW",
        "MEDIUM",
    ],
    "PlaceConfidence": [
        "HIGH_CONFIDENCE",
        "LOW_CONFIDENCE",
        "MEDIUM_CONFIDENCE",
        "USER_CONFIRMED",
    ],
};
