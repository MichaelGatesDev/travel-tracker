// To parse this data:
//
//   import { Convert, SemanticLocationHistoryJULY2018 } from "./file";
//
//   const semanticLocationHistoryJULY2018 = Convert.toSemanticLocationHistoryJULY2018(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface SemanticLocationHistoryJULY2018 {
    timelineObjects: TimelineObject[];
}

export interface TimelineObject {
    activitySegment?: ActivitySegment;
    placeVisit?:      PlaceVisit;
}

export interface ActivitySegment {
    startLocation:      Location;
    endLocation:        Location;
    duration:           Duration;
    distance?:          number;
    activityType:       string;
    confidence?:        Confidence;
    activities:         Activity[];
    waypointPath?:      WaypointPath;
    simplifiedRawPath?: SimplifiedRawPath;
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

export interface Location {
    latitudeE7:  number;
    longitudeE7: number;
    sourceInfo?: SourceInfo;
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

export interface WaypointPath {
    waypoints: { [key: string]: number }[];
}

export interface PlaceVisit {
    location:        LocationClass;
    duration:        Duration;
    placeConfidence: PlaceConfidence;
    centerLatE7:     number;
    centerLngE7:     number;
    childVisits?:    ChildVisit[];
}

export interface ChildVisit {
    location:        LocationClass;
    duration:        Duration;
    placeConfidence: PlaceConfidence;
    centerLatE7:     number;
    centerLngE7:     number;
}

export interface LocationClass {
    latitudeE7:    number;
    longitudeE7:   number;
    placeId:       string;
    address:       string;
    name:          string;
    sourceInfo:    SourceInfo;
    semanticType?: string;
}

export enum PlaceConfidence {
    HighConfidence = "HIGH_CONFIDENCE",
    LowConfidence = "LOW_CONFIDENCE",
    MediumConfidence = "MEDIUM_CONFIDENCE",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toSemanticLocationHistoryJULY2018(json: string): SemanticLocationHistoryJULY2018 {
        return cast(JSON.parse(json), r("SemanticLocationHistoryJULY2018"));
    }

    public static semanticLocationHistoryJULY2018ToJson(value: SemanticLocationHistoryJULY2018): string {
        return JSON.stringify(uncast(value, r("SemanticLocationHistoryJULY2018")), null, 2);
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
    "SemanticLocationHistoryJULY2018": o([
        { json: "timelineObjects", js: "timelineObjects", typ: a(r("TimelineObject")) },
    ], false),
    "TimelineObject": o([
        { json: "activitySegment", js: "activitySegment", typ: u(undefined, r("ActivitySegment")) },
        { json: "placeVisit", js: "placeVisit", typ: u(undefined, r("PlaceVisit")) },
    ], false),
    "ActivitySegment": o([
        { json: "startLocation", js: "startLocation", typ: r("Location") },
        { json: "endLocation", js: "endLocation", typ: r("Location") },
        { json: "duration", js: "duration", typ: r("Duration") },
        { json: "distance", js: "distance", typ: u(undefined, 0) },
        { json: "activityType", js: "activityType", typ: "" },
        { json: "confidence", js: "confidence", typ: u(undefined, r("Confidence")) },
        { json: "activities", js: "activities", typ: a(r("Activity")) },
        { json: "waypointPath", js: "waypointPath", typ: u(undefined, r("WaypointPath")) },
        { json: "simplifiedRawPath", js: "simplifiedRawPath", typ: u(undefined, r("SimplifiedRawPath")) },
    ], false),
    "Activity": o([
        { json: "activityType", js: "activityType", typ: "" },
        { json: "probability", js: "probability", typ: 3.14 },
    ], false),
    "Duration": o([
        { json: "startTimestampMs", js: "startTimestampMs", typ: "" },
        { json: "endTimestampMs", js: "endTimestampMs", typ: "" },
    ], false),
    "Location": o([
        { json: "latitudeE7", js: "latitudeE7", typ: 0 },
        { json: "longitudeE7", js: "longitudeE7", typ: 0 },
        { json: "sourceInfo", js: "sourceInfo", typ: u(undefined, r("SourceInfo")) },
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
    "WaypointPath": o([
        { json: "waypoints", js: "waypoints", typ: a(m(0)) },
    ], false),
    "PlaceVisit": o([
        { json: "location", js: "location", typ: r("LocationClass") },
        { json: "duration", js: "duration", typ: r("Duration") },
        { json: "placeConfidence", js: "placeConfidence", typ: r("PlaceConfidence") },
        { json: "centerLatE7", js: "centerLatE7", typ: 0 },
        { json: "centerLngE7", js: "centerLngE7", typ: 0 },
        { json: "childVisits", js: "childVisits", typ: u(undefined, a(r("ChildVisit"))) },
    ], false),
    "ChildVisit": o([
        { json: "location", js: "location", typ: r("LocationClass") },
        { json: "duration", js: "duration", typ: r("Duration") },
        { json: "placeConfidence", js: "placeConfidence", typ: r("PlaceConfidence") },
        { json: "centerLatE7", js: "centerLatE7", typ: 0 },
        { json: "centerLngE7", js: "centerLngE7", typ: 0 },
    ], false),
    "LocationClass": o([
        { json: "latitudeE7", js: "latitudeE7", typ: 0 },
        { json: "longitudeE7", js: "longitudeE7", typ: 0 },
        { json: "placeId", js: "placeId", typ: "" },
        { json: "address", js: "address", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "sourceInfo", js: "sourceInfo", typ: r("SourceInfo") },
        { json: "semanticType", js: "semanticType", typ: u(undefined, "") },
    ], false),
    "string": [
        "BOATING",
        "CYCLING",
        "HIKING",
        "IN_PASSENGER_VEHICLE",
        "MOTORCYCLING",
        "RUNNING",
        "UNKNOWN_ACTIVITY_TYPE",
        "WALKING",
    ],
    "Confidence": [
        "HIGH",
        "LOW",
        "MEDIUM",
    ],
    "PlaceConfidence": [
        "HIGH_CONFIDENCE",
        "LOW_CONFIDENCE",
        "MEDIUM_CONFIDENCE",
    ],
};
