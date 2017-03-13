// tslint:disable-next-line:no-var-requires
require("babel-core/register");
require("babel-polyfill");

// Need this when running in node (not in browser), to make the domain-task resolve local-url's
import { baseUrl as dummyTestBaseUrl } from 'domain-task/fetch';
dummyTestBaseUrl('http://localhost'); // Relative URLs will be resolved against this

import { AllCategories, Authentication, Autocomplete, BestBets, Categorize, Find, SearchClient, Settings, OrderBy, SearchType, Categories, Matches, FindSettings, FindTrigger } from '../src/SearchClient';

describe("SearchClient basics", () => {

    it("Should have imported SearchClient class defined", () => {
        expect(typeof SearchClient).toBe("function");
    });

    it("Should be able to create SearchClient instance", () => {
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");
        expect(typeof searchClient).toBe("object");
    });

    it("Should throw for invalid Urls", () => {
        expect(() => {
            let searchClient = new SearchClient("file://localhost:9950/RestService/v3/");
        }).toThrow();

        expect(() => {
            let searchClient = new SearchClient("http:+//localhost:9950/RestService/v3/");
        }).toThrow();
    });

    it("Search instance with empty settings should have autocomplete(), find(), categorize(), allCategories() and bestBets() interface", () => {
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");

        expect(typeof searchClient.allCategories).toBe("object");
        expect(searchClient.allCategories instanceof AllCategories).toBeTruthy();

        expect(typeof searchClient.authentication).toBe("object");
        expect(searchClient.authentication instanceof Authentication).toBeTruthy();

        expect(typeof searchClient.autocomplete).toBe("object");
        expect(searchClient.autocomplete instanceof Autocomplete).toBeTruthy();

        expect(typeof searchClient.bestBets).toBe("object");
        expect(searchClient.bestBets instanceof BestBets).toBeTruthy();

        expect(typeof searchClient.categorize).toBe("object");
        expect(searchClient.categorize instanceof Categorize).toBeTruthy();

        expect(typeof searchClient.find).toBe("object");
        expect(searchClient.find instanceof Find).toBeTruthy();
    });

    it("Search instance with disabled 'services' should not have autocomplete(), find(), categorize(), allCategories() and bestBets() interface", () => {
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/", {
            allCategories: {enabled: false},
            authentication: {enabled: false},
            autocomplete: {enabled: false},
            bestBets: {enabled: false},
            categorize: {enabled: false},
            find: {enabled: false},
        } as Settings);

        expect(typeof searchClient.allCategories).not.toBe("object");
        expect(searchClient.allCategories instanceof AllCategories).toBeFalsy();

        expect(typeof searchClient.authentication).not.toBe("object");
        expect(searchClient.authentication instanceof Authentication).toBeFalsy();

        expect(typeof searchClient.autocomplete).not.toBe("object");
        expect(searchClient.autocomplete instanceof Autocomplete).toBeFalsy();

        expect(typeof searchClient.bestBets).not.toBe("object");
        expect(searchClient.bestBets instanceof BestBets).toBeFalsy();

        expect(typeof searchClient.categorize).not.toBe("object");
        expect(searchClient.categorize instanceof Categorize).toBeFalsy();

        expect(typeof searchClient.find).not.toBe("object");
        expect(searchClient.find instanceof Find).toBeFalsy();
    });

    it("Search instance with empty settings should have expected query interfaces", () => {
        let client = new SearchClient("http://localhost:9950/RestService/v3/");

        // authenticationToken
        expect(client.authenticationToken).toBeUndefined();
        client.authenticationToken = "test";
        expect(client.authenticationToken).toEqual("test");

        // clientId
        expect(client.clientId).toEqual("");
        client.clientId = "test";
        expect(client.clientId).toEqual("test");

        // dateFrom/dateTo
        expect(client.dateFrom).toBeNull();
        expect(client.dateTo).toBeNull();

        let from = {M: -2};
        client.dateFrom = from;
        expect(client.dateFrom).toEqual(from);

        let to = {M: -1};
        client.dateTo = to;
        expect(client.dateTo).toEqual(to);

        // filters
        expect(client.filters).toHaveLength(0);
        client.filters = ["test1", "test2"];
        expect(client.filters).toContain("test1");
        expect(client.filters).toContain("test2");

        expect(client.filters).not.toContain("test3");
        expect(client.filters).toHaveLength(2);
        // Removing a filter that is not there should not change the list.
        client.filterRemove("test3");
        expect(client.filters).not.toContain("test3");
        expect(client.filters).toHaveLength(2);

        client.filterAdd("test3");
        expect(client.filters).toContain("test3");
        expect(client.filters).toHaveLength(3);
        // Add same filter again should not duplicate it.
        client.filterAdd("test3");
        expect(client.filters).toContain("test3");
        expect(client.filters).toHaveLength(3);
        client.filterRemove("test3");
        expect(client.filters).not.toContain("test3");
        client.filterRemove("test2");
        expect(client.filters).not.toContain("test2");
        client.filterRemove("test1");
        expect(client.filters).not.toContain("test1");
        expect(client.filters).toHaveLength(0);
        // Remove same filter even when the list is empty, should not fail or change the no of items.
        client.filterRemove("test1");
        expect(client.filters).toHaveLength(0);

        // matchGrouping
        expect(client.matchGrouping).toBeFalsy();
        client.matchGrouping = true;
        expect(client.matchGrouping).toBeTruthy();
        client.matchGrouping = false;
        expect(client.matchGrouping).toBeFalsy();

        // matchPage
        expect(client.matchPage).toEqual(0);
        client.matchPage = 1;
        expect(client.matchPage).toEqual(1);
        client.matchPage = -1;
        expect(client.matchPage).toEqual(0);
        client.matchPagePrev();
        expect(client.matchPage).toEqual(0);
        client.matchPageNext();
        expect(client.matchPage).toEqual(1);
        client.matchPageNext();
        expect(client.matchPage).toEqual(2);
        client.matchPagePrev();
        expect(client.matchPage).toEqual(1);

        // matchPageSize
        expect(client.matchPageSize).toEqual(10);
        client.matchPageSize = 0;
        expect(client.matchPageSize).toEqual(1);
        client.matchPageSize = 10;
        expect(client.matchPageSize).toEqual(10);

        // matchOrderBy
        expect(client.matchOrderBy).toEqual(OrderBy.Relevance);
        client.matchOrderBy = OrderBy.Date;
        expect(client.matchOrderBy).toEqual(OrderBy.Date);

        //maxSuggestions
        expect(client.maxSuggestions).toEqual(10);
        client.maxSuggestions = 5;
        expect(client.maxSuggestions).toEqual(5);
        client.maxSuggestions = 0;
        expect(client.maxSuggestions).toEqual(0);
        client.maxSuggestions = -1;
        expect(client.maxSuggestions).toEqual(0);

        // queryText
        expect(client.queryText).toEqual("");
        client.queryText = "test";
        expect(client.queryText).toEqual("test");

        // searchType
        expect(client.searchType).toEqual(SearchType.Keywords);
        client.searchType = SearchType.Relevance;
        expect(client.searchType).toEqual(SearchType.Relevance);

        // go
        expect(client.findAndCategorize).toBeDefined();
        // TODO: client.findAndCategorize();
        
        expect(client.findAndCategorize).toBeDefined();

        let now = new Date();
        let PFind = <any> Find;
        let params = PFind.getUrlParams(client.query);
        let dateFrom = new Date(decodeURIComponent(params[2].split("=")[1]));
        let dateTo = new Date(decodeURIComponent(params[3].split("=")[1]));

        // Expecting the from-date to be two months back in time. 
        const fromDiff = Math.round((now.valueOf() - dateFrom.valueOf()) / (1000 * 60 * 60 * 24));
        // Expecting the to-date to be one month back in time. 
        const toDiff = Math.round((now.valueOf() - dateTo.valueOf()) / (1000 * 60 * 60 * 24));

        expect(fromDiff).toBeGreaterThanOrEqual(59); // shortest two months = 28+31
        expect(fromDiff).toBeLessThanOrEqual(62); // longest two months = 31+31
        expect(toDiff).toBeGreaterThanOrEqual(28); // shortest month = 28
        expect(toDiff).toBeLessThanOrEqual(31); // Longest month = 31
    });

    it("Search instance with empty settings should have expected query interfaces", () => {
        let settings = new Settings({
            find: {
                cbSuccess: <any> jest.fn(),
                trigger: {
                    queryChange: true,
                    queryChangeInstantRegex: /\S $/,
                },
            },
        } as Settings);

        let client = new SearchClient("http://localhost:9950/RestService/v3/", settings);
        let pClient = <any> client;
        
        const autocompleteFetch = jest.fn();
        (<any> client.autocomplete).fetch = autocompleteFetch;

        const categorizeFetch = jest.fn();
        (<any> client.categorize).fetch = categorizeFetch;

        const findFetch = jest.fn();
        (<any> client.find).fetch = findFetch;


        // With current settings none of the services should update for queryText="test"
        client.queryText = "test";
        expect(pClient.settings.query.queryText).toEqual("test");
        expect(pClient.settings.find.trigger.queryChange).toEqual(true);
        expect(pClient.find.settings.trigger.queryChange).toEqual(true);
        expect(pClient.settings.find.trigger.queryChangeInstantRegex).toEqual(/\S $/);
        expect(pClient.find.settings.trigger.queryChangeInstantRegex).toEqual(/\S $/);
        expect(autocompleteFetch).not.toBeCalled(); autocompleteFetch.mockReset();
        expect(categorizeFetch).not.toBeCalled(); categorizeFetch.mockReset();
        expect(findFetch).not.toBeCalled(); findFetch.mockReset();


        // But, if the query ends with a space then the find-service should update (has callback and has enabled queryChangeTrigger and set instanceRegex)
        client.queryText = "test ";
        expect(pClient.settings.query.queryText).toEqual("test ");
        expect(autocompleteFetch).not.toBeCalled(); autocompleteFetch.mockReset();
        expect(categorizeFetch).not.toBeCalled(); categorizeFetch.mockReset();
        expect(findFetch).toBeCalled(); findFetch.mockReset();

        // But, if we do the same, this time while deferring updates, the update should not be called.
        client.deferUpdatesForAll(true);
        client.queryText = "test";
        client.queryText = "test ";
        expect(pClient.settings.query.queryText).toEqual("test ");
        expect(autocompleteFetch).not.toBeCalled(); autocompleteFetch.mockReset();
        expect(categorizeFetch).not.toBeCalled(); categorizeFetch.mockReset();
        expect(findFetch).not.toBeCalled(); findFetch.mockReset();

        // At least not until we again open up the deferring
        client.deferUpdatesForAll(false);
        expect(autocompleteFetch).not.toBeCalled(); autocompleteFetch.mockReset();
        expect(categorizeFetch).not.toBeCalled(); categorizeFetch.mockReset();
        expect(findFetch).toHaveBeenCalledTimes(1); findFetch.mockReset();

        // We try once more to defer updates
        client.deferUpdatesForAll(true);
        client.queryText = "test";
        client.queryText = "test ";
        expect(pClient.settings.query.queryText).toEqual("test ");
        expect(autocompleteFetch).not.toBeCalled(); autocompleteFetch.mockReset();
        expect(categorizeFetch).not.toBeCalled(); categorizeFetch.mockReset();
        expect(findFetch).not.toBeCalled(); findFetch.mockReset();

        // But this time we open and skipPending updates when clearing the defer
        client.deferUpdatesForAll(false, true);
        expect(autocompleteFetch).not.toBeCalled(); autocompleteFetch.mockReset();
        expect(categorizeFetch).not.toBeCalled(); categorizeFetch.mockReset();
        expect(findFetch).not.toBeCalled(); findFetch.mockReset();
        
    });
});
