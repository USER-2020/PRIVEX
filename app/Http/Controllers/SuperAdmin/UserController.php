<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use App\Mail\WelcomeUserMail;

class UserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Manager/Users/Create', [
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['nullable', 'string', 'exists:roles,name'],
        ]);

        $plainPassword = $data['password'];
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($plainPassword),
        ]);

        if (!empty($data['role'])) {
            $user->assignRole($data['role']);
        }

        Mail::to($user->email)->send(new WelcomeUserMail($user, $plainPassword));

        return redirect()
            ->route('manager.users.create')
            ->with('status', 'Usuario creado.');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Manager/Users/Edit', [
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles()->first()?->name,
            ],
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', "unique:users,email,{$user->id}"],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['nullable', 'string', 'exists:roles,name'],
        ]);

        $user->name = $data['name'];
        $user->email = $data['email'];

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();
        $user->syncRoles($data['role'] ? [$data['role']] : []);

        return redirect()
            ->route('manager.users.edit', $user)
            ->with('status', 'Usuario actualizado.');
    }
}
