import fetch from "cross-fetch";

import { DateSpecification } from "./Query";
import { OrderBy } from "./OrderBy";
import { SearchType } from "./SearchType";
import { IBaseSettings } from "./BaseSettings";
import { AuthToken } from "../Authentication/AuthToken";

import { Filter } from "./Filter";
import { Query } from "./Query";
import { CategorizationType } from "./CategorizationType";

export type Fetch = (
    input?: Request | string,
    init?: RequestInit
) => Promise<Response>;

/**
 * A common service base-class for the descending Autocomplete, Categorize and Find classes.
 *
 * @param TDataType Defines the data-type that the descendant service-class needs to return on lookups.
 */
export abstract class BaseCall<TDataType> {
    protected fetchMethod: Fetch;

    protected settings?: IBaseSettings<TDataType>;

    protected auth?: AuthToken;

    protected deferUpdate: boolean;

    protected deferredQuery: Query | null;

    protected delay: number;

    /**
     * Decides whether an update should be executed or not. Typically used to temporarily turn off update-execution.
     * When turned back on the second param can be used to indicate whether pending updates should be executed or not.
     * @param state Turns on or off deferring of updates.
     * @param skipPending Used to indicate if a pending update is to be executed or skipped when deferring is turned off. The param is ignored for state=true.
     */
    public deferUpdates(state: boolean, skipPending: boolean = false) {
        this.deferUpdate = state;
        if (!state && this.deferredQuery) {
            const query = this.deferredQuery;
            this.deferredQuery = null;
            if (!skipPending && this.shouldUpdate()) {
                this.update(query);
            }
        }
    }

    /**
     * Can be used to check the state of deferUpdates.
     */
    get deferUpdateState(): boolean {
        return this.deferUpdate;
    }

    /**
     * Sets up the Request that is to be executed, with headers and auth as needed.
     *
     * @param includeAuthorizationHeader Set to false to not include the auth jwt token in the request headers. Default=true
     */
    public requestObject(
        includeAuthorizationHeader: boolean = true
    ): RequestInit {
        const headers: any = {
            "Content-Type": "application/json"
        };

        if (
            includeAuthorizationHeader &&
            this.auth &&
            this.auth.authenticationToken
        ) {
            headers.Authorization = `Bearer ${this.auth.authenticationToken}`;
        }

        return {
            cache: "default",
            credentials: "include",
            headers,
            method: "GET",
            mode: "cors"
        } as RequestInit;
    }

    /**
     * Call the service, but take into account deferredUpdates.
     *
     * @param query The query object to create the fetch for.
     * @param delay A delay for when to execute the update, in milliseconds. Defaults to undefined.
     * @param useQueryMatchPage If true then the query matchpage number will not be reset to 1. Otherwise it is by default always 1.
     */
    public update(
        query: Query,
        delay?: number,
        useQueryMatchPage?: boolean
    ): void {
        if (!useQueryMatchPage) {
            query.matchPage = 1;
        }
        if (this.deferUpdate) {
            // Save the query, so that when the deferUpdate is again false we can then execute it.
            this.deferredQuery = query;
        } else {
            // In case this action is triggered when a delayed execution is already pending, clear that pending timeout.
            clearTimeout(this.delay);

            if (delay > 0) {
                // Set up the delay
                this.delay = setTimeout(() => {
                    let fetchPromise = this.fetch(query);
                    if (fetchPromise) {
                        fetchPromise.catch(error => Promise.resolve(null));
                    }
                }, delay) as any;
            } else {
                let fetchPromise = this.fetch(query);
                if (fetchPromise) {
                    fetchPromise.catch(error => Promise.resolve(null));
                }
            }
        }
    }

    public shouldUpdate(): boolean {
        return this.settings.cbSuccess && this.settings.enabled;
    }

    // public clientCategoryExpansionChanged(
    //     oldValue: { [key: string]: boolean },
    //     query: Query
    // ): void {
    //     /* Default no implementation*/
    // }

    // public clientCategoryFilterChanged(
    //     oldValue: { [key: string]: string | RegExp },
    //     query: Query
    // ): void {
    //     /* Default no implementation*/
    // }

    public clientIdChanged(oldValue: string, query: Query): void {
        /* Default no implementation*/
    }
    public categorizationTypeChanged(
        oldValue: CategorizationType,
        query: Query
    ): void {
        /* Default no implementation*/
    }
    public dateFromChanged(oldValue: DateSpecification, query: Query): void {
        /* Default no implementation*/
    }
    public dateToChanged(oldValue: DateSpecification, query: Query): void {
        /* Default no implementation*/
    }
    public filtersChanged(oldValue: Filter[], query: Query): void {
        /* Default no implementation*/
    }
    public matchGenerateContentChanged(oldValue: boolean, query: Query): void {
        /* Default no implementation*/
    }
    public matchGenerateContentHighlightsChanged(
        oldValue: boolean,
        query: Query
    ): void {
        /* Default no implementation*/
    }
    public matchGroupingChanged(oldValue: boolean, query: Query): void {
        /* Default no implementation*/
    }
    public matchOrderByChanged(oldValue: OrderBy, query: Query): void {
        /* Default no implementation*/
    }
    public matchPageChanged(oldValue: number, query: Query): void {
        /* Default no implementation*/
    }
    public matchPageSizeChanged(oldValue: number, query: Query): void {
        /* Default no implementation*/
    }
    public maxSuggestionsChanged(oldValue: number, query: Query): void {
        /* Default no implementation*/
    }
    public queryTextChanged(oldValue: string, query: Query): void {
        /* Default no implementation*/
    }
    public searchTypeChanged(oldValue: SearchType, query: Query): void {
        /* Default no implementation*/
    }
    public uiLanguageCodeChanged(oldValue: string, query: Query): void {
        /* Default no implementation*/
    }

    /**
     * Sets up a the common base handling for services, such as checking that the url is valid and handling the authentication.
     *
     * @param settings - The base url for the service to be setup.
     * @param auth - The auth-object that controls authentication for the service.
     */
    protected init(
        settings: IBaseSettings<TDataType>,
        auth?: AuthToken,
        fetchMethod?: Fetch
    ) {
        this.settings = settings;
        this.auth = auth;
        this.fetchMethod = fetchMethod || fetch;
    }

    protected abstract fetch(
        query?: Query,
        suppressCallbacks?: boolean
    ): Promise<any>;

    protected cbRequest(
        suppressCallbacks: boolean,
        url: string,
        reqInit: RequestInit
    ): boolean {
        if (!this.settings) {
            throw new Error("Settings cannot be empty.");
        }
        if (this.settings.cbRequest && !suppressCallbacks) {
            return this.settings.cbRequest(url, reqInit) !== false;
        }
        // If no request-callback is set up we return true to allow the fetch to be executed
        return true;
    }

    protected cbError(
        suppressCallbacks: boolean,
        error: any,
        url: string,
        reqInit: RequestInit
    ): void {
        if (!this.settings) {
            throw new Error("Settings cannot be empty.");
        }
        if (this.settings.cbSuccess && !suppressCallbacks) {
            this.settings.cbError(error);
        }
    }

    protected cbSuccess(
        suppressCallbacks: boolean,
        data: TDataType,
        url: string,
        reqInit: RequestInit
    ): void {
        if (!this.settings) {
            throw new Error("Settings cannot be empty.");
        }
        if (this.settings.cbSuccess && !suppressCallbacks) {
            this.settings.cbSuccess(data);
        }
    }
}
