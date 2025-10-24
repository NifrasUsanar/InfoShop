<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Store;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(){
        $stores = Store::select('id', 'name')->get();
        $roles = Role::where('name', '!=', 'super-admin')->get();
        $users=User::select('users.id','users.name','user_name', 'user_role', 'email', 'stores.name as store_name', 'users.created_at', 'store_id')->leftJoin('stores','stores.id','=','users.store_id')->where('user_role','!=','super-admin')->where('is_active', 1)->get();
        return Inertia::render('User/User',[
            'users'=>$users,
            'stores'=>$stores,
            'roles'=>$roles,
            'pageLabel'=>'Users',
        ]);
    }

    public function userRole(){
        $roles = Role::with('permissions')->where('name', '!=', 'super-admin')->get()->map(function ($role) {
            // Map each role to include a comma-separated list of permissions
            $role->permissions_list = $role->permissions->pluck('name')->join(', ');
            return $role;
        });
        $permissions = Permission::select('id', 'name')->get();
        return Inertia::render('User/UserRole',[
            'roles'=>$roles,
            'permissions'=>$permissions,
            'pageLabel'=>'User Roles',
        ]);
    }

    public function storeRole(Request $request)
    {
        // Validation
        $validator = Validator::make($request->all(), [
            'user_role' => 'required|unique:roles,name',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $role = Role::create([
            'name' => $request->user_role,  // Set the role name from the request
        ]);

        $permissions = collect($request->permissions)->map(function ($permission) {
            return Permission::firstOrCreate(['name' => $permission]);
        });

        // Attach the permissions to the new role
        $role->syncPermissions($permissions);

        // Redirect back to the user roles page with success message
        return redirect()->route('user.role')
            ->with('success', 'Role and permissions assigned successfully!');
    }

    public function updateRole(Request $request, $roleId)
    {
        // Validation
        $validator = Validator::make($request->all(), [
            'user_role' => 'required|exists:roles,name',  // Ensure the role exists
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Find role by ID
        $role = Role::findOrFail($roleId);

         // Sync permissions to the role (replace the existing permissions with the new ones)
         $permissions = collect($request->permissions)->map(function ($permission) {
            return Permission::firstOrCreate(['name' => $permission]);
        });
        $role->syncPermissions($permissions);

        // Redirect back to the user roles page with success message
        return redirect()->route('user.role')
            ->with('success', 'Role and permissions updated successfully!');
    }

    public function store(Request $request)
    {
        // Validate the incoming request
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:4',
            'user_name' => 'required|string|max:255|unique:users',
            'user_role' => 'required|string|exists:roles,name',
        ]);

        // Create a new user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password), // Hash the password
            'user_name' => $request->user_name,
            'user_role' => $request->user_role,
            'store_id' => $request->store_id,
        ]);

        $user->assignRole($request->user_role);

        return Redirect::route('users.index');
    }

    public function update(Request $request, $id)
    {
        // Find the user by ID
        $user = User::findOrFail($id);

        // Validate the incoming request
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:4', // Password is optional for update
            'user_name' => 'required|string|max:255|unique:users,user_name,'. $user->id,
            'user_role' => 'required|string|exists:roles,name',
        ]);

        // Update user details
        $user->name = $request->name;
        $user->email = $request->email;
        $user->user_name = $request->user_name;
        $user->user_role = $request->user_role;
        $user->store_id= $request->store_id;

        // Only update the password if it is provided
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->syncRoles($request->user_role);

        $user->save();

        return Redirect::route('users.index');
    }

    public function userDeactivate($id){
        $user = User::findOrFail($id);

        if (Auth::user()->id === $user->id) {
        return response()->json([
            'message' => 'You cannot deactivate your own account.'
        ], 403);
    }

        $user->is_active = 0;
        $user->save();
        return response()->json(['message' => 'User deactivated successfully.']);
    }
}
