import Handlebars from 'handlebars';

Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('addOne', function (value) {
  return parseInt(value) + 1;
});

const enumMemberTemplate = `
<div class="input-group mb-3 data-row-container">
    <input
        type="text"
        class="form-control"
        placeholder="enumMember"
        value="{{member}}"
        required
        pattern="^([a-zA-Z_][a-zA-Z\\d_]*)$"
        title="Please provide a valid identifier">
    <button type="button" class="btn btn-danger" aria-label="remove" onclick="removeDataRow(this)">&times;</button>
</div>
`;

Handlebars.registerPartial('enumMember', enumMemberTemplate);
export const enumMemberFunction = Handlebars.compile(enumMemberTemplate);

const enumTypeTemplate = `
<div mb-3">
    <label for="name" class="form-label">Name</label>
    <input
        type="text"
        id="nameInput"
        name="name"
        class="form-control"
        placeholder="name"
        value="{{$Name}}"
        required
        pattern="^([a-zA-Z_][a-zA-Z\\d_]*)$"
        title="Please provide a valid identifier">
</div>

<h6>Members</h6>
<div id="enumMembersContainer">
    {{#each enumMembers}}
    {{>enumMember $Index=@index member=this}}
    {{/each}}

    <div class="d-grid gap-2">
        <button type="button" class="btn btn-info" data-structured-kind="{{$Kind}}" onclick="addEnumMember(this)">Add</button>
    </div>
</div>
`;

export const enumTypeFunction = Handlebars.compile(enumTypeTemplate);

// Structure Type

const propertyTemplate = `
<div class="input-group mb-3 data-row-container">
    {{#ifEquals $StructuredKind "EntityType"}}
    <div class="input-group-text">
        <input class="form-radio-input mt-0" type="radio" name="pk" aria-label="Is PK" {{#if property.isPk}}checked{{/if}}>
    </div>
    {{/ifEquals}}
    {{#unless $NoName}}
    <input
        type="text"
        class="form-control"
        placeholder="property"
        value="{{property.name}}"
        required
        pattern="^([a-zA-Z_][a-zA-Z\\d_]*)$"
        title="Please provide a valid identifier">
    {{/unless}}
    <select class="form-select">
        {{#each $TypeOptions}}
        <option value="{{this}}" {{#ifEquals this ../property.type}}selected{{/ifEquals}}>{{this}}</option>
        {{/each}}
    </select>
    <div class="input-group-text">
        <input class="form-check-input mt-0" type="checkbox" value="isCollection" aria-label="Is Collection" {{#if property.isCollection}}checked{{/if}}>
    </div>
    <div class="input-group-text">
        <input class="form-check-input mt-0" type="checkbox" value="isNullable" aria-label="Is Nullable" {{#if property.isNullable}}checked{{/if}}>
    </div>
    <button type="button" class="btn btn-danger" aria-label="remove" onclick="removeDataRow(this)">&times;</button>
</div>
`;

Handlebars.registerPartial('property', propertyTemplate);
export const propertyFunction = Handlebars.compile(propertyTemplate);

const operationTemplate = `
<div class="accordion-item data-row-container">
    <h2  id="operation_header_{{$Index}}" class="accordion-header">
        <button 
            type="button"
            class="accordion-button collapsed"
            data-bs-toggle="collapse"
            data-bs-target="#operation_collapse_{{$Index}}"
            aria-expanded="false"
            aria-controls="operation_collapse_{{$Index}}"
            >
            Operation #{{ addOne $Index }}
        </button>
    </h2>
    <div 
        id="operation_collapse_{{$Index}}"
        class="accordion-collapse collapse"
        aria-labelledby="operation_header_{{$Index}}"
        data-bs-parent="#operationsContainer"
        >
        <div class="accordion-body">

            <div class="input-group mb-3">
                <input
                    type="text"
                    class="form-control"
                    placeholder="property"
                    value="{{operation.$Name}}"
                    required
                    pattern="^([a-zA-Z_][a-zA-Z\\d_]*)$"
                    title="Please provide a valid identifier">
                <select class="form-select">
                    <option value="Function" {{#ifEquals operation.$Kind "Function"}}selected{{/ifEquals}}>Function</option>
                    <option value="Action" {{#ifEquals operation.$Kind "Action"}}selected{{/ifEquals}}>Action</option>
                </select>
                <button type="button" class="btn btn-danger" aria-label="remove" onclick="removeDataRow(this)">&times;</button>
            </div>

            <div class="d-flex">
                <div class="p-2">
                    <div class="form-check form-switch">
                        <input 
                            type="checkbox"
                            id="hasReturns_{{$Index}}"
                            class="form-check-input"
                            {{#if $ReturnType}}checked{{/if}}
                            data-bs-toggle="collapse"
                            data-bs-target="#operationReturnContainer_{{$Index}}"
                            aria-expanded="{{#if $ReturnType}}true{{else}}false{{/if}}"
                            aria-controls="operationReturnContainer"
                            >
                        <label for="hasReturns_{{$Index}}" class="form-check-label">
                            <h6>Returns</h6>
                        </label>
                    </div>
                </div>
                <div class="flex-grow-1">
                    <div id="operationReturnContainer_{{$Index}}" class="collapse {{#if $ReturnType}}show{{/if}}">
                    {{>property $Index=-7 $NoName=true property=$ReturnType $TypeOptions=$TypeOptions $StructuredKind=operation.$Kind}}
                    </div>
                </div>
            </div>

            <h6>Parameters</h6>
            {{#each $InputParameters}}
            {{>property $Index=@index property=this $TypeOptions=../$TypeOptions $StructuredKind=../operation.$Kind}}
            {{/each}}

            <div class="d-grid gap-2">
                <button type="button" class="btn btn-info" data-structured-kind="{{operation.$Kind}} "onclick="addInputParameter(this)">Add</button>
            </div>
                    
        </div>
    </div>

</div>

`;

Handlebars.registerPartial('operation', operationTemplate);
export const operationFunction = Handlebars.compile(operationTemplate);

const structuredTypeTemplate = `
<div mb-3">
    <label for="name" class="form-label">Name</label>
    <input
        type="text"
        id="nameInput"
        name="name"
        class="form-control"
        placeholder="name"
        value="{{$Name}}"
        required
        pattern="^([a-zA-Z_][a-zA-Z\\d_]*)$"
        title="Please provide a valid identifier">
</div>

<h6>Propeties</h6>
{{#each $Properties}}
{{>property $Index=@index property=this $TypeOptions=../$TypeOptions $StructuredKind=../$Kind}}
{{/each}}

<div class="d-grid gap-2">
    <button type="button" class="btn btn-info" data-structured-kind="{{$Kind}}" onclick="addProperty(this)">Add</button>
</div>

{{#ifEquals $Kind "EntityType"}}
<h6>Operations</h6>
<div id="operationsContainer" class="accordion">

{{#each $Operations}}
{{>operation $Index=@index operation=this $TypeOptions=../$TypeOptions}}
{{/each}}

</div>

<div class="d-grid gap-2">
    <button type="button" class="btn btn-info" data-structured-kind="{{$Kind}}" onclick="addOperation(this)">Add</button>
</div>

{{/ifEquals}}
`;

export const structuredTypeFunction = Handlebars.compile(
  structuredTypeTemplate
);

// Entity Container
const entityContainerTemplate = `
<div mb-3">
    <label for="name" class="form-label">Name</label>
    <input
        type="text"
        id="nameInput"
        name="name"
        class="form-control"
        placeholder="name"
        value="{{$Name}}"
        readonly
        required
        pattern="^([a-zA-Z_][a-zA-Z\\d_]*)$"
        title="Please provide a valid identifier">
    {{log 'Name is ' this}}
</div>

<h6>Navigation Sources</h6>

{{#each $NavigationSources}}
{{>property $Index=@index property=this $TypeOptions=../$EntityTypes $StructuredKind=../$Kind}}
{{/each}}

<div class="d-grid gap-2">
    <button type="button" class="btn btn-info" data-structured-kind="{{$Kind}}" onclick="addNavigationSource(this)">Add</button>
</div>
`;

export const entityContainerFunction = Handlebars.compile(
  entityContainerTemplate
);
