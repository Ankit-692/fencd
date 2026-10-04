export namespace models {
	
	export class Permissions {
	    network: boolean;
	    camera: boolean;
	    microphone: boolean;
	    display: boolean;
	    gpu: boolean;
	    dbus: boolean;
	    fsHome: boolean;
	    fsHost: boolean;
	    audioOutput: boolean;
	    virtualization: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Permissions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.network = source["network"];
	        this.camera = source["camera"];
	        this.microphone = source["microphone"];
	        this.display = source["display"];
	        this.gpu = source["gpu"];
	        this.dbus = source["dbus"];
	        this.fsHome = source["fsHome"];
	        this.fsHost = source["fsHost"];
	        this.audioOutput = source["audioOutput"];
	        this.virtualization = source["virtualization"];
	    }
	}
	export class AppModel {
	    id: string;
	    name: string;
	    type: string;
	    icon: string;
	    permissions: Permissions;
	
	    static createFrom(source: any = {}) {
	        return new AppModel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.icon = source["icon"];
	        this.permissions = this.convertValues(source["permissions"], Permissions);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class SystemApp {
	    name: string;
	    execPath: string;
	    icon: string;
	
	    static createFrom(source: any = {}) {
	        return new SystemApp(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.execPath = source["execPath"];
	        this.icon = source["icon"];
	    }
	}

}

