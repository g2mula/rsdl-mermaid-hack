import Handlebars from 'handlebars';

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
const enumMemberTemplate = `
<div class="input-group mb-3">
    <input type="text" class="form-control" placeholder="enumMember" value="{{this}}" />
    <button type="button" class="btn btn-danger" aria-label="remove" onclick="removeEnumMember(this)">&times;</button>
</div>
`;

Handlebars.registerPartial('enumMember', enumMemberTemplate);
export const enumMemberFunction = Handlebars.compile(enumMemberTemplate);

const enumTypeTemplate = `
<div mb-3">
    <label for="name" class="form-label">Name</label>
    <input type="text" id="nameInput" name="name" class="form-control" placeholder="name" value="{{$Name}}">
</div>

<h6>Members</h6>
{{#each enumMembers}}
{{>enumMember}}
{{/each}}

<div class="d-grid gap-2">
    <button type="button" class="btn btn-info" onclick="addEnumMember(this)">Add</button>
</div>
`;

export const enumTypeFunction = Handlebars.compile(enumTypeTemplate);


// Structure Type

const structuredPropertyTemplate = `
<div class="input-group mb-3">
    {{#ifEquals structuredKind "EntityType"}}
    <div class="input-group-text">
        <input class="form-radio-input mt-0" type="radio" name="pk" aria-label="Is PK" {{#if property.isPk}}checked{{/if}}>
    </div>
    {{/ifEquals}}
    <input type="text" class="form-control" placeholder="property" value="{{property.name}}" />
    <select class="form-select">
        {{#each typeOptions}}
        <option value="{{this}}" {{#ifEquals this ../property.type}}selected{{/ifEquals}}>{{this}}</option>
        {{/each}}
    </select>
    <div class="input-group-text">
        <input class="form-check-input mt-0" type="checkbox" value="isCollection" aria-label="Is Collection" {{#if property.isCollection}}checked{{/if}}>
    </div>
    <div class="input-group-text">
        <input class="form-check-input mt-0" type="checkbox" value="isNullable" aria-label="Is Nullable" {{#if property.isNullable}}checked{{/if}}>
    </div>
    <button type="button" class="btn btn-danger" aria-label="remove" onclick="removeProperty(this)">&times;</button>
</div>
`;

Handlebars.registerPartial('structuredProperty', structuredPropertyTemplate);
export const structuredPropertyFunction = Handlebars.compile(structuredPropertyTemplate);

const operationTemplate = `
<div class="input-group mb-3">
    <input type="text" class="form-control" placeholder="property" value="{{$Name}}" />
    <select class="form-select">
        <option value="Function" {{#ifEquals $Kind "Function"}}selected{{/ifEquals}}>Function</option>
        <option value="Action" {{#ifEquals $Kind "Action"}}selected{{/ifEquals}}>Action</option>
    </select>
    <button type="button" class="btn btn-danger" aria-label="remove" onclick="removeOperation(this)">&times;</button>
</div>
`;

Handlebars.registerPartial('operation', operationTemplate);
export const operationFunction = Handlebars.compile(operationTemplate);

const structuredTypeTemplate = `
<div mb-3">
    <label for="name" class="form-label">Name</label>
    <input type="text" id="nameInput" name="name" class="form-control" placeholder="name" value="{{$Name}}">
</div>

<h6>Propeties</h6>
{{#each $Properties}}
{{>structuredProperty property=this typeOptions=../$TypeOptions structuredKind=../$Kind}}
{{/each}}

<div class="d-grid gap-2">
    <button type="button" class="btn btn-info" onclick="addProperty(this)">Add</button>
</div>

{{#ifEquals $Kind "EntityType"}}
<h6>Operations</h6>
{{#each $Operations}}
{{>operation}}
{{/each}}

<div class="d-grid gap-2">
    <button type="button" class="btn btn-info" onclick="addProperty(this)">Add</button>
</div>

{{/ifEquals}}
`;

export const structuredTypeFunction = Handlebars.compile(structuredTypeTemplate);
