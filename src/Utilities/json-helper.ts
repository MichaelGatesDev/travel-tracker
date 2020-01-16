export class JSONHelper {

    public static findValuesHelper(obj: any, key: string){
        let list: any[] = [];
        if (!obj) return list;
        if (obj instanceof Array) {
            for (var i in obj) {
                list = list.concat(JSONHelper.findValuesHelper(obj[i], key));
            }
            return list;
        }
        if (obj[key]) list.push(obj[key]);

        if ((typeof obj == "object") && (obj !== null)) {
            let children = Object.keys(obj);
            if (children.length > 0) {
                for (let i = 0; i < children.length; i++) {
                    list = list.concat(JSONHelper.findValuesHelper(obj[children[i]], key));
                }
            }
        }
        return list;
    }
}