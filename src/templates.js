import Handlebars from 'handlebars';

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
