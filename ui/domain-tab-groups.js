/*	
* Vivaldi Domain Tab Groups (updated for browser version 7.0)
* Written by nafumofu	
*
* Groups tabs based on their domain	
*/

(async () => {
    'use strict';
    
    const config = {
        // Use the base domain for tab stacks (true: enabled, false: disabled)
        base_domain: false,
        
        // Automatically change the name of the tab stack (0: disabled, 1: use hostname, 2: generate from base domain)
        rename_stack: 2,
        
        // Workspaces that allow automatic tab stacking (exact match or <default_workspace>)
        // * If not set, automatic tab stacking is allowed in all workspaces
        allow_workspaces: [
            // "<default_workspace>",
            // "Shopping",
        ],
        
        // Domains that allow automatic tab stacking (exact match or regular expression)
        // * If not set, automatic tab stacking is allowed for all domains
        allow_domains: [
            // "www.example.com",
            // /^(.+\.)?example\.net$/,
        ],
        
        // Domains to exclude from automatic tab stacking (exact match or regular expression)
        block_domains: [
            // "www.example.com",
            // /^(.+\.)?example\.net$/,
        ],
    };
    
    const mergeArrays = (...arrays) => [...new Set(arrays.flat())];
    
    const getUrlFragments = (url) => vivaldi.utilities.getUrlFragments(url);
    
    const getBaseDomain = (url) => {
        const {hostForSecurityDisplay, tld} = getUrlFragments(url);
        return hostForSecurityDisplay.match(`([^.]+\\.${ tld })$`)?.[1] || hostForSecurityDisplay;
    };
    
    const getHostname = (url) => {
        const {hostForSecurityDisplay} = getUrlFragments(url);
        return config.base_domain ? getBaseDomain(url) : hostForSecurityDisplay;
    };
    
    const matchHostRule = (url, rule) => {
        const {hostForSecurityDisplay} = getUrlFragments(url);
        return rule instanceof RegExp ? rule.test(hostForSecurityDisplay) : hostForSecurityDisplay === rule;
    };
    
    const getTab = async (tabId) => {
        const tab = await chrome.tabs.get(tabId);
        
        if (tab.vivExtData) {
            tab.vivExtData = JSON.parse(tab.vivExtData);
            return tab;
        }
    };
    
    const getTabIndex = async (tabId) => (await getTab(tabId)).index;
    
    const getWorkspaceName = async (workspaceId) => {
        if (!workspaceId) {
            return '<default_workspace>';
        }
        const workspaceList = await vivaldi.prefs.get('vivaldi.workspaces.list');
        return workspaceList.find(item => item.id === workspaceId).name;
    };
    
    const getTabsByWorkspace = async () => {
        const tabs = (await chrome.tabs.query({ currentWindow: true }))
            .filter(tab => tab.id !== -1 && tab.vivExtData)
            .map(tab => Object.assign(tab, { vivExtData: JSON.parse(tab.vivExtData) }))
            .filter(tab => !tab.pinned && !tab.vivExtData.panelId)
            .filter(tab => !config.allow_domains.length || config.allow_domains.find(rule => matchHostRule(tab.url, rule)))
            .filter(tab => !config.block_domains.length || !config.block_domains.find(rule => matchHostRule(tab.url, rule)));
        
        return Object.groupBy(tabs, tab => tab.vivExtData.workspaceId);
    };
    
    const getTabsByStack = (tabs) => Object.groupBy(tabs, tab => tab.vivExtData.group);
    
    const getTabsByHost = (tabs) => Object.groupBy(tabs, tab => getHostname(tab.url));
    
    const getMaxTabsStackId = (tabsByStack, targetHost) => {
        const counts = {};
        
        for (const [stackId, tabs] of Object.entries(tabsByStack)) {
            if (stackId !== 'undefined') {
                const tabsByHost = getTabsByHost(tabs);
                const count = tabsByHost[targetHost]?.length || 0;
                
                delete tabsByHost[targetHost];
                counts[stackId] = Object.values(tabsByHost)
                    .reduce((acc, tabs) => {
                        return acc > tabs.length ? acc : 0;
                    }, count);
            }
        }
        
        return Object.entries(counts)
            .reduce((acc, [stackId, count]) => {
                return acc[1] < count ? [stackId, count] : acc;
            }, [, 0])[0];
    };
    
    const getTabStackName = (url) => {
        let stackName;
        
        switch (config.rename_stack) {
            case 1:
                stackName = getHostname(url);
                break;
            case 2:
                stackName = getBaseDomain(url).split('.')[0];
                stackName = stackName.charAt(0).toUpperCase() + stackName.slice(1);
                break;
        }
        return stackName;
    };
    
    const addTabStack = async (tabId, stackId, stackName) => {
        const {vivExtData} = await getTab(tabId);
        
        if (stackName) {
            vivExtData.fixedGroupTitle = stackName;
        }
        vivExtData.group = stackId;
        chrome.tabs.update(tabId, { vivExtData: JSON.stringify(vivExtData) });
    };
    
    const stackingTabs = async (workspaceId) => {
        const workspaceName = await getWorkspaceName(workspaceId);
        
        if (!config.allow_workspaces.length || config.allow_workspaces.includes(workspaceName)) {
            const tabsByWorkspace = await getTabsByWorkspace();
            const tabsByStack = getTabsByStack(tabsByWorkspace[workspaceId]);
            const tabsByHost = getTabsByHost(tabsByWorkspace[workspaceId]);
            
            for (const [host, tabs] of Object.entries(tabsByHost)) {
                const targetStackId = getMaxTabsStackId(tabsByStack, host) || crypto.randomUUID();
                const targetStackTabs = tabsByStack[targetStackId] ? getTabsByHost(tabsByStack[targetStackId])[host] : [];
                const targetTabs = mergeArrays(targetStackTabs, tabs);
                const targetStackName = getTabStackName(tabs[0].pendingUrl || tabs[0].url);
                
                let tabIndex = await getTabIndex(targetTabs[0].id);
                
                for (const tab of targetTabs) {
                    addTabStack(tab.id, targetStackId, targetStackName);
                    chrome.tabs.move(tab.id, { index: tabIndex });
                    tabIndex++;
                }
            }
        }
    };
    
    chrome.webNavigation.onCommitted.addListener(async details => {
        if (details.tabId !== -1) {
            const tab = await getTab(details.tabId);
            
            if (tab && !tab.pinned && !tab.vivExtData.panelId && details.frameType === 'outermost_frame') {
                const workspaceId = tab.vivExtData.workspaceId;
                stackingTabs(workspaceId);
            }
        }
    });
})();
