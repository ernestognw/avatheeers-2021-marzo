/**
 * Creates a template for the inventory of avatheeers
 *
 * @param {string|number} id
 * @param {string} name
 * @param {string|number} dna
 * @param {string} src
 */
 const inventoryItem = (id, name, dna, src) => `
 <div id="avatheeer-${id}" class="uk-card uk-card-default">
   <div class="uk-card-header">
     <div class="uk-grid-small uk-flex-middle" uk-grid>
       <div class="uk-width-expand">
         <h3 class="uk-card-title uk-margin-remove-bottom">${name}</h3>
         <p style="font-size: 9px;" class="uk-text-meta uk-margin-remove-top">${dna}</p>
       </div>
     </div>
   </div>
   <div class="uk-body uk-padding-small">
     <img class="uk-align-center"
       src="${src}" />
   </div>
   <div class="uk-card-footer">
     <button class="uk-button uk-button-default uk-width-1-1 uk-margin-small-bottom button-kill" name="${id}">Kill</button>
     <button class="uk-button uk-button-primary uk-width-1-1 uk-margin-small-bottom button-gift" name="${id}">Gift</button>
   </div>
 </div>`;

const emptyInventory = `
 <div></div>
 <p style="text-align: center; width: 100%">It seems you don't have any Avatheeers yet</p>
 <div></div>
`;

const spinner = `
 <div style="width: 20px;" uk-spinner></div>
`;

const ropstenRequest = `
 <div class="uk-position-center">
   Connect your metamask with Ropsten and reload
 </div>  
`;

export { inventoryItem, emptyInventory, spinner, ropstenRequest };
