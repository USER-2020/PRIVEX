<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@privex.test'],
            [
                'name' => 'Admin',
                'password' => Hash::make('Admin123!'),
            ]
        );

        $manager = User::firstOrCreate(
            ['email' => 'manager@privex.test'],
            [
                'name' => 'Manager',
                'password' => Hash::make('Manager123!'),
            ]
        );

        $user = User::firstOrCreate(
            ['email' => 'user@privex.test'],
            [
                'name' => 'User',
                'password' => Hash::make('User123!'),
            ]
        );

        $admin->assignRole('admin');
        $manager->assignRole('manager');
        $user->assignRole('user');
    }
}
